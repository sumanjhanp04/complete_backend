import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { CALENDAR_EVENT_TYPE } from '../consts/consts.schema';
import { Shift } from '../employees/shift.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Calendar extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, enum: CALENDAR_EVENT_TYPE, default: null })
  type: string;

  @Prop({ type: String, default: null })
  location: string;

  @Prop({ type: String, default: null })
  timezone: string;

  @Prop({ type: String, required: true })
  startDate: string;

  @Prop({ type: String, required: false })
  endDate: string;

  @Prop({ type: String, required: false })
  startTime: string;

  @Prop({ type: String, required: false })
  endTime: string;

  @Prop({ type: String, default: '#28b463' })
  color: string;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: User.name, default: [] },
    ],
  })
  attendees: string[];

  @Prop({ type: String, default: null })
  meetingLink: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  owner?: string;

  //Recurring Events
  @Prop({ type: Boolean, default: false })
  isRecurring: boolean;

  @Prop({
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null,
  })
  frequency: string;

  @Prop({ type: Number, default: null })
  interval?: number;

  @Prop({ type: Number, default: null })
  count?: number;

  @Prop({ type: String, default: null })
  expiryDate?: string;

  @Prop({
    type: [String],
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    default: [],
  })
  daysOfWeek?: string[];
  @Prop({
    type: String,
    enum: ['recurring', 'overlapping', 'normal'],
    default: null,
  })
  scheduleType: string;

  @Prop({
    type: String,
    enum: ['EMPLOYEES', 'CLIENTS', 'SPECIFIC', 'SHIFT'],
    required: true,
  })
  userType: string;

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: ['email', 'inApp'],
        },
        reminder: {
          type: String,
        },
        timeUnit: {
          type: String,
          enum: ['minutes', 'hour', 'days'],
        },
      },
    ],
    default: [],
  })
  notifications: Array<{
    type: string;
    reminder: string;
    timeUnit: string;
  }>;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Shift.name,
    default: null,
  })
  shift: string;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
