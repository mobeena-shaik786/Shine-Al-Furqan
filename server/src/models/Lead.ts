import { Schema, model, type Document, type Types } from 'mongoose';

export const LEAD_STATUSES = [
  'new',
  'follow_up',
  'interested',
  'enrolled',
  'not_interested',
] as const;

export const LEAD_SOURCES = [
  'whatsapp',
  'website',
  'referral',
  'walk_in',
  'social',
  'other',
] as const;

export const LEAD_GENDERS = ['male', 'female', 'other', 'prefer_not'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadGender = (typeof LEAD_GENDERS)[number];

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  gender?: LeadGender;
  source: LeadSource;
  status: LeadStatus;
  language?: string;
  assignment?: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    gender: { type: String, enum: LEAD_GENDERS },
    source: { type: String, enum: LEAD_SOURCES, required: true, default: 'whatsapp' },
    status: { type: String, enum: LEAD_STATUSES, required: true, default: 'new' },
    language: { type: String, trim: true, maxlength: 50 },
    assignment: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ source: 1 });
leadSchema.index({ name: 'text', phone: 'text', email: 'text' });

export const Lead = model<ILead>('Lead', leadSchema);
