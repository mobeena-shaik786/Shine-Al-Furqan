import { z } from 'zod';
import { Topic } from '../models/academic/Topic';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';

const objectIdString = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Valid id is required');

export const createTopicSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export const updateTopicSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
});

export const listTopicsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  activeOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((v) => v === true || v === 'true'),
  activity: z
    .union([z.enum(['active', 'inactive']), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
});

export function toTopicDto(topic: {
  _id: unknown;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    _id: String(topic._id),
    title: topic.title,
    description: topic.description,
    isActive: topic.isActive,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  };
}

export async function listTopics(query: z.infer<typeof listTopicsQuerySchema>) {
  const filter: Record<string, unknown> = {};
  if (query.activeOnly || query.activity === 'active') filter.isActive = true;
  if (query.activity === 'inactive') filter.isActive = false;
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  const topics = await Topic.find(filter).sort({ title: 1 });
  return topics.map(toTopicDto);
}

export async function createTopic(raw: unknown) {
  const input = createTopicSchema.parse(raw);
  try {
    const topic = await Topic.create({
      title: input.title,
      description: input.description ?? '',
      isActive: input.isActive ?? true,
    });
    return toTopicDto(topic);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      throw new AppError('A topic with this title already exists', 409, [
        { field: 'title', message: 'Topic title must be unique' },
      ]);
    }
    throw err;
  }
}

export async function updateTopic(id: string, raw: unknown) {
  if (!objectIdString.safeParse(id).success) {
    throw new AppError('Topic not found', 404);
  }
  const input = updateTopicSchema.parse(raw);
  const topic = await Topic.findById(id);
  if (!topic) throw new AppError('Topic not found', 404);

  if (input.title !== undefined) topic.title = input.title;
  if (input.description !== undefined) topic.description = input.description;
  if (input.isActive !== undefined) topic.isActive = input.isActive;

  try {
    await topic.save();
    return toTopicDto(topic);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      throw new AppError('A topic with this title already exists', 409, [
        { field: 'title', message: 'Topic title must be unique' },
      ]);
    }
    throw err;
  }
}

export async function deleteTopic(id: string) {
  if (!objectIdString.safeParse(id).success) {
    throw new AppError('Topic not found', 404);
  }
  const topic = await Topic.findByIdAndDelete(id);
  if (!topic) throw new AppError('Topic not found', 404);
}

export async function getTopicsByIds(ids: string[]) {
  const valid = ids.filter((id) => objectIdString.safeParse(id).success);
  const topics = await Topic.find({ _id: { $in: valid } });
  return topics.map(toTopicDto);
}
