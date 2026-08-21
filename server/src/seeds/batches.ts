import { Batch, Course } from '../models/academic';
import { User } from '../models/User';

const DEMO_COURSE = {
  title: 'Quran Foundations',
  code: 'QURAN-FOUND',
  description: 'Demo course for seeded teaching batches',
  category: 'quran',
  status: 'published' as const,
};

export const DEMO_BATCH_NAMES = ['morning batch 10:30am', 'noon batch 3:00pm'] as const;

export async function ensureSeedBatches(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!admin) {
    console.warn('⚠️  Skipping batch seed: no admin user found');
    return;
  }

  let course = await Course.findOne({ code: DEMO_COURSE.code });
  if (!course) {
    course = await Course.create({
      ...DEMO_COURSE,
      createdBy: admin._id,
    });
    console.log(`✅ Seeded course: ${course.code}`);
  }

  for (const name of DEMO_BATCH_NAMES) {
    const existing = await Batch.findOne({ name });
    if (existing) {
      console.log(`ℹ️  Batch already present: ${name}`);
      continue;
    }

    await Batch.create({
      name,
      course: course._id,
      capacity: 30,
      status: 'active',
      createdBy: admin._id,
      scheduleNote: name,
    });
    console.log(`✅ Seeded batch: ${name}`);
  }
}
