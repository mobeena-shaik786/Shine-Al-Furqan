import { SystemSettings, type ISystemSettings } from '../models/SystemSettings';
import type { UpdateSettingsInput } from '../validators/settings.validator';

const DEFAULTS = {
  key: 'default',
  salary: {
    basePay: 2000,
    incentiveRate: 150,
    defaultMode: 'unique' as const,
  },
  liveClass: {
    enabled: true,
    jitsiDomain: 'meet.jit.si',
    roomPrefix: 'shine-al-furqan',
  },
};

export function toSettingsDto(doc: ISystemSettings) {
  return {
    salary: {
      basePay: doc.salary.basePay,
      incentiveRate: doc.salary.incentiveRate,
      defaultMode: doc.salary.defaultMode,
    },
    liveClass: {
      enabled: doc.liveClass.enabled,
      jitsiDomain: doc.liveClass.jitsiDomain,
      roomPrefix: doc.liveClass.roomPrefix,
    },
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getOrCreateSettings(): Promise<ISystemSettings> {
  let doc = await SystemSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = await SystemSettings.create(DEFAULTS);
  }
  return doc;
}

export async function getSettings() {
  const doc = await getOrCreateSettings();
  return toSettingsDto(doc);
}

export async function getSalaryRules() {
  const doc = await getOrCreateSettings();
  return {
    basePay: doc.salary.basePay,
    incentiveRate: doc.salary.incentiveRate,
    defaultMode: doc.salary.defaultMode,
  };
}

export async function updateSettings(input: UpdateSettingsInput) {
  const doc = await getOrCreateSettings();
  if (input.salary) {
    if (input.salary.basePay !== undefined) doc.salary.basePay = input.salary.basePay;
    if (input.salary.incentiveRate !== undefined) doc.salary.incentiveRate = input.salary.incentiveRate;
    if (input.salary.defaultMode !== undefined) doc.salary.defaultMode = input.salary.defaultMode;
  }
  if (input.liveClass) {
    if (input.liveClass.enabled !== undefined) doc.liveClass.enabled = input.liveClass.enabled;
    if (input.liveClass.jitsiDomain !== undefined) {
      doc.liveClass.jitsiDomain = input.liveClass.jitsiDomain.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }
    if (input.liveClass.roomPrefix !== undefined) doc.liveClass.roomPrefix = input.liveClass.roomPrefix;
  }
  await doc.save();
  return toSettingsDto(doc);
}
