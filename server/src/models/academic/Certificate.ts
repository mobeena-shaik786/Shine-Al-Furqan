import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICertificate extends Document {
  certificateNo: string;
  student: Types.ObjectId;
  batch: Types.ObjectId;
  course: Types.ObjectId;
  issuedAt: Date;
  issuedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateNo: { type: String, required: true, trim: true, unique: true, maxlength: 64 },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

certificateSchema.index({ student: 1, batch: 1 }, { unique: true });
certificateSchema.index({ batch: 1, issuedAt: -1 });
certificateSchema.index({ certificateNo: 'text' });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
