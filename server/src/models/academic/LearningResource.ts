import mongoose, { Document, Schema, Types } from 'mongoose';

export const RESOURCE_STATUSES = ['active', 'deleted'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export interface ILearningResource extends Document {
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  /** Safe display name only — never used as storage path. */
  originalFilename: string;
  /** Server-generated key under storage root (uuid + allowlisted extension). */
  storedKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: Types.ObjectId;
  status: ResourceStatus;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const learningResourceSchema = new Schema<ILearningResource>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    originalFilename: { type: String, required: true, maxlength: 200 },
    storedKey: { type: String, required: true, unique: true, maxlength: 80 },
    mimeType: { type: String, required: true, maxlength: 100 },
    sizeBytes: { type: Number, required: true, min: 1 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: RESOURCE_STATUSES,
      default: 'active',
      required: true,
      index: true,
    },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

learningResourceSchema.index({ lesson: 1, status: 1 });
learningResourceSchema.index({ course: 1, status: 1 });

export const LearningResource = mongoose.model<ILearningResource>(
  'LearningResource',
  learningResourceSchema,
);
