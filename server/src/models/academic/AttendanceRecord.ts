import mongoose, { Document, Schema, Types } from 'mongoose';

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export interface IAttendanceRecord extends Document {
  session: Types.ObjectId; student: Types.ObjectId; status: AttendanceStatus; markedBy: Types.ObjectId;
  createdAt: Date; updatedAt: Date;
}
const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  session: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceRecordSchema.index({ student: 1, createdAt: -1 });
export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
