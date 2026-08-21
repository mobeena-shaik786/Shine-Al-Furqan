import { Topic } from '../models/academic/Topic';

export const SEED_TOPICS: Array<{ title: string; description: string }> = [
  {
    title: 'Color-Coded Quran',
    description:
      'Master the rules of Tajweed through guided lessons using the Color-Coded Quran. Learn correct pronunciation, recitation, and application of Tajweed marks.',
  },
  {
    title: 'Ahsanul Qawaid',
    description:
      'Learn the fundamentals of Quran reading through the Ahsanul Qawaid book, including Arabic letters, pronunciation, joining letters, and basic fluency.',
  },
  {
    title: 'Test Syllabus',
    description: 'Introductory syllabus for practice courses and internal demos.',
  },
  {
    title: 'Tajweed Basics',
    description: 'Core Tajweed rules for beginners: makharij, sifaat, and common mistakes.',
  },
  {
    title: 'Seerah Overview',
    description: 'A structured overview of the life of the Prophet ﷺ for academy batches.',
  },
];

export async function ensureSeedTopics(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;

  for (const item of SEED_TOPICS) {
    const existing = await Topic.findOne({ title: item.title });
    if (existing) continue;
    await Topic.create({
      title: item.title,
      description: item.description,
      isActive: true,
    });
    console.log(`✅ Seeded topic: ${item.title}`);
  }
}
