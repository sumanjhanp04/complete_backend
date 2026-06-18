import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
} from '../consts/consts.schema';
import { User } from '../authentication/user.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Notification extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  notifier: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  actor: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  data: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  @Prop({ enum: NOTIFICATION_STATUS, default: NOTIFICATION_STATUS.UNREAD })
  status: string;

  @Prop({ enum: NOTIFICATION_PRIORITY, default: NOTIFICATION_PRIORITY.MEDIUM })
  priority: string;

  @Prop({ type: String, default: null })
  expiresAt: string;

  @Prop({ type: String, default: null })
  redirectUrl: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
