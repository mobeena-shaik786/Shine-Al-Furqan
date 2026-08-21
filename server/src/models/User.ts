import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export const USER_ROLES = ['admin', 'coordinator', 'ustad', 'student'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_GENDERS = ['male', 'female', 'other', 'prefer_not'] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  gender?: UserGender | '';
  languages?: string[];
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student',
      required: true,
    },
    isActive: { type: Boolean, default: true },
    gender: {
      type: String,
      enum: [...USER_GENDERS, ''],
      default: '',
    },
    languages: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
    },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    alternatePhone: { type: String, trim: true, maxlength: 40, default: '' },
    workLocation: { type: String, trim: true, maxlength: 200, default: '' },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, gender: 1 });
userSchema.index({ role: 1, languages: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const obj = { ...ret } as Record<string, unknown>;
    delete obj.password;
    delete obj.__v;
    return obj;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
