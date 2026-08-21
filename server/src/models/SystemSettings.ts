import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  salary: {
    basePay: number;
    incentiveRate: number;
    defaultMode: 'unique' | 'fixed';
  };
  liveClass: {
    enabled: boolean;
    jitsiDomain: string;
    roomPrefix: string;
  };
  updatedAt: Date;
  createdAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    salary: {
      basePay: { type: Number, required: true, min: 0, default: 2000 },
      incentiveRate: { type: Number, required: true, min: 0, default: 150 },
      defaultMode: { type: String, enum: ['unique', 'fixed'], default: 'unique' },
    },
    liveClass: {
      enabled: { type: Boolean, default: true },
      jitsiDomain: { type: String, trim: true, default: 'meet.jit.si', maxlength: 200 },
      roomPrefix: { type: String, trim: true, default: 'shine-al-furqan', maxlength: 80 },
    },
  },
  { timestamps: true },
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
