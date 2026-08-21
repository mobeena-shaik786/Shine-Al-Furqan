import { Lead, type ILead, type LeadStatus } from '../models/Lead';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';
import type { CreateLeadInput, ListLeadsQuery, UpdateLeadInput } from '../validators/lead.validator';

function toDto(lead: ILead) {
  return {
    _id: String(lead._id),
    name: lead.name,
    phone: lead.phone,
    email: lead.email || '',
    gender: lead.gender,
    source: lead.source,
    status: lead.status,
    language: lead.language || '',
    assignment: lead.assignment || '',
    notes: lead.notes || '',
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function listLeads(query: ListLeadsQuery) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.gender) filter.gender = query.gender;
  if (query.source) filter.source = query.source;
  if (query.language) filter.language = query.language;
  if (query.assignment === 'assigned') {
    filter.assignment = { $exists: true, $nin: [null, ''] };
  } else if (query.assignment === 'unassigned') {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      {
        $or: [
          { assignment: { $exists: false } },
          { assignment: null },
          { assignment: '' },
        ],
      },
    ];
  } else if (query.assignment) {
    filter.assignment = new RegExp(escapeRegExp(query.assignment), 'i');
  }
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
    filter.createdAt = createdAt;
  }

  const [rows, total, statusGroups] = await Promise.all([
    Lead.find(filter)
      .sort('-createdAt')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Lead.countDocuments(filter),
    Lead.aggregate<{ _id: LeadStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(statusGroups.map((g) => [g._id, g.count])) as Partial<
    Record<LeadStatus, number>
  >;
  const statsTotal = Object.values(byStatus).reduce((a, b) => a + (b || 0), 0);

  return {
    leads: rows.map(toDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      stats: {
        total: statsTotal,
        new: byStatus.new || 0,
        follow_up: byStatus.follow_up || 0,
        interested: byStatus.interested || 0,
        enrolled: byStatus.enrolled || 0,
        not_interested: byStatus.not_interested || 0,
        interestedAndEnrolled: (byStatus.interested || 0) + (byStatus.enrolled || 0),
      },
    },
  };
}

export async function createLead(input: CreateLeadInput, createdBy?: string) {
  const lead = await Lead.create({
    ...input,
    email: input.email || undefined,
    language: input.language || undefined,
    assignment: input.assignment || undefined,
    notes: input.notes || '',
    createdBy,
  });
  return toDto(lead);
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);
  Object.assign(lead, {
    ...input,
    ...(input.email !== undefined ? { email: input.email || undefined } : {}),
    ...(input.language !== undefined ? { language: input.language || undefined } : {}),
    ...(input.assignment !== undefined ? { assignment: input.assignment || undefined } : {}),
  });
  await lead.save();
  return toDto(lead);
}

export async function deleteLead(id: string) {
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw new AppError('Lead not found', 404);
}
