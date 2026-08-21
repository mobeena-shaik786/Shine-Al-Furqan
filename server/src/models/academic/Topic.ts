import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, unique: true },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

topicSchema.index({ title: 'text', description: 'text' });

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);
