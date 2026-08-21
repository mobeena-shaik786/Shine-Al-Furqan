import { Types } from 'mongoose';
import { User } from '../models/User';
import {
  AttendanceRecord,
  AttendanceSession,
  Batch,
  Enrollment,
  type IBatch,
} from '../models/academic';
import { WEEKDAYS, type Weekday } from '../models/academic/Batch';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';
import {
  type ListSalariesQuery,
  type SalaryDetailQuery,
  type SalaryMode,
} from '../validators/salary.validator';
import { getSalaryRules } from './settings.service';

const WEEKDAY_NAMES: Weekday[] = [...WEEKDAYS];

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekdayName(date: Date): Weekday {
  return (
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
  )[date.getUTCDay()] as Weekday;
}

/** Calendar class days for the month from batch schedule slots (Mon–Sat fallback). */
export function countFixedDays(year: number, month: number, batches: IBatch[]): number {
  const needed = new Set<Weekday>();
  for (const batch of batches) {
    for (const slot of batch.scheduleSlots || []) {
      needed.add(slot.day);
    }
  }
  if (needed.size === 0) {
    for (const day of WEEKDAY_NAMES) {
      if (day !== 'Sunday') needed.add(day);
    }
  }
  const total = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (needed.has(weekdayName(date))) count += 1;
  }
  return count;
}

function computePay(
  totalPresent: number,
  uniqueDays: number,
  fixedDays: number,
  mode: SalaryMode,
  basePay: number,
  incentiveRate: number,
) {
  const usedDays = mode === 'unique' ? uniqueDays : fixedDays;
  const safeUsed = usedDays > 0 ? usedDays : 0;
  const ratio = safeUsed > 0 ? totalPresent / safeUsed : 0;
  const incentive = ratio * incentiveRate;
  const total = basePay + incentive;
  return {
    usedDays: safeUsed,
    uniqueDays,
    fixedDays,
    ratio,
    basePay,
    incentiveRate,
    incentive,
    total,
  };
}

async function loadUstadBatches(ustadId: Types.ObjectId) {
  return Batch.find({
    instructors: ustadId,
    status: { $in: ['planned', 'active'] },
  });
}

async function attendanceStatsForBatches(
  batchIds: Types.ObjectId[],
  start: Date,
  end: Date,
) {
  if (batchIds.length === 0) {
    return { totalPresent: 0, uniqueDays: 0, sessionsByBatch: new Map<string, number>() };
  }

  const sessions = await AttendanceSession.find({
    batch: { $in: batchIds },
    status: 'conducted',
    sessionDate: { $gte: start, $lt: end },
  }).select('_id batch sessionDate');

  const sessionIds = sessions.map((s) => s._id);
  const uniqueDaySet = new Set(sessions.map((s) => utcDayKey(s.sessionDate)));
  const sessionsByBatch = new Map<string, number>();
  for (const s of sessions) {
    const key = String(s.batch);
    sessionsByBatch.set(key, (sessionsByBatch.get(key) || 0) + 1);
  }

  let totalPresent = 0;
  if (sessionIds.length > 0) {
    totalPresent = await AttendanceRecord.countDocuments({
      session: { $in: sessionIds },
      status: 'present',
    });
  }

  return {
    totalPresent,
    uniqueDays: uniqueDaySet.size,
    sessionsByBatch,
  };
}

async function studentCounts(batchIds: Types.ObjectId[]) {
  if (batchIds.length === 0) return new Map<string, number>();
  const rows = await Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { batch: { $in: batchIds }, status: 'active' } },
    { $group: { _id: '$batch', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export async function listUstadSalaries(query: ListSalariesQuery) {
  const { year, month, mode } = query;
  const { start, end } = monthBounds(year, month);

  const userFilter: Record<string, unknown> = { role: 'ustad', isActive: true };
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    userFilter.$or = [{ name: rx }, { email: rx }];
  }

  const ustads = await User.find(userFilter).sort({ name: 1 });
  const allActiveBatches = await Batch.find({
    status: { $in: ['planned', 'active'] },
    instructors: { $exists: true, $ne: [] },
  }).select('_id instructors');
  const rules = await getSalaryRules();

  const rows = [];
  for (const ustad of ustads) {
    const batches = await loadUstadBatches(ustad._id as Types.ObjectId);
    const batchIds = batches.map((b) => b._id as Types.ObjectId);
    const { totalPresent, uniqueDays, sessionsByBatch } = await attendanceStatsForBatches(
      batchIds,
      start,
      end,
    );
    const fixedDays = countFixedDays(year, month, batches);
    const pay = computePay(
      totalPresent,
      uniqueDays,
      fixedDays,
      mode,
      rules.basePay,
      rules.incentiveRate,
    );
    const counts = await studentCounts(batchIds);
    const studentTotal = [...counts.values()].reduce((a, b) => a + b, 0);

    const batchSummaries = batches.map((b) => ({
      _id: String(b._id),
      name: b.name,
      studentCount: counts.get(String(b._id)) || 0,
      classCount: sessionsByBatch.get(String(b._id)) || 0,
    }));

    rows.push({
      ustadId: String(ustad._id),
      name: ustad.name,
      email: ustad.email,
      batchCount: batches.length,
      studentTotal,
      batches: batchSummaries,
      totalPresent,
      ...pay,
      mode,
      year,
      month,
    });
  }

  // If search matches batch names, include those ustads already filtered by user search only.
  // Extra: filter rows by batch name client-side is enough; also filter here.
  const filtered = query.search
    ? rows.filter((row) => {
        const q = query.search!.toLowerCase();
        return (
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.batches.some((b) => b.name.toLowerCase().includes(q))
        );
      })
    : rows;

  const activeBatchCount = new Set(
    allActiveBatches
      .filter((b) => (b.instructors || []).length > 0)
      .map((b) => String(b._id)),
  ).size;

  return {
    rows: filtered,
    meta: {
      year,
      month,
      mode,
      basePay: rules.basePay,
      incentiveRate: rules.incentiveRate,
      stats: {
        totalSalary: filtered.reduce((s, r) => s + r.total, 0),
        ustadCount: filtered.length,
        totalPresent: filtered.reduce((s, r) => s + r.totalPresent, 0),
        classDays: filtered.reduce((s, r) => s + r.usedDays, 0),
        activeBatches: activeBatchCount,
      },
    },
  };
}

export async function getUstadSalaryDetail(ustadId: string, query: SalaryDetailQuery) {
  if (!Types.ObjectId.isValid(ustadId)) throw new AppError('Invalid ustad id', 400);
  const ustad = await User.findOne({ _id: ustadId, role: 'ustad' });
  if (!ustad) throw new AppError('Ustad not found', 404);

  const { year, month, mode } = query;
  const { start, end } = monthBounds(year, month);
  const batches = await loadUstadBatches(ustad._id as Types.ObjectId);
  const batchIds = batches.map((b) => b._id as Types.ObjectId);
  const { totalPresent, uniqueDays, sessionsByBatch } = await attendanceStatsForBatches(
    batchIds,
    start,
    end,
  );
  const fixedDays = countFixedDays(year, month, batches);
  const rules = await getSalaryRules();
  const pay = computePay(
    totalPresent,
    uniqueDays,
    fixedDays,
    mode,
    rules.basePay,
    rules.incentiveRate,
  );
  const counts = await studentCounts(batchIds);

  const batchSummaries = batches.map((b) => ({
    _id: String(b._id),
    name: b.name,
    studentCount: counts.get(String(b._id)) || 0,
    classCount: sessionsByBatch.get(String(b._id)) || 0,
  }));

  return {
    ustadId: String(ustad._id),
    name: ustad.name,
    email: ustad.email,
    year,
    month,
    mode,
    totalPresent,
    ...pay,
    batches: batchSummaries,
    calculation: {
      steps: [
        `Total present = ${totalPresent} (student present marks; late/absent excluded)`,
        `Class days used = ${pay.usedDays} (${mode === 'unique' ? 'Unique attendance days' : 'Fixed calendar days'}; unique ${uniqueDays}; fixed ${fixedDays})`,
        `Ratio = ${totalPresent} ÷ ${pay.usedDays || 0} = ${pay.ratio.toFixed(4)}`,
        `Incentive = ${pay.ratio.toFixed(4)} × ₹${rules.incentiveRate} = ₹${pay.incentive.toFixed(2)}`,
        `Total = ₹${rules.basePay} + ₹${pay.incentive.toFixed(2)} = ₹${pay.total.toFixed(2)}`,
      ],
    },
  };
}
