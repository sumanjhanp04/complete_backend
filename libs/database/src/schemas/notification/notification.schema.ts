// Import decorators used to create MongoDB schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import mongoose Document class
import mongoose, { Document } from 'mongoose';

// Import notification status and priority enums/constants
import {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
} from '../consts/consts.schema';

// Import User schema for reference relationships
import { User } from '../authentication/user.schema';

// Create MongoDB schema options
@Schema({
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false, // Removes __v field from MongoDB documents
})

// Notification collection schema
export class Notification extends Document {
  // User who receives the notification
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name, // Reference to User collection
    required: true, // Mandatory field
  })
  notifier: string;

  // User who triggered the notification
  // Example:
  // Suman comments on a task
  // notifier = Rahul
  // actor = Suman
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  actor: string;

  // Dynamic data for notification
  // Example:
  // {
  //   taskId: "123",
  //   taskName: "Backend API"
  // }
  @Prop({ type: mongoose.Schema.Types.Mixed })
  data: Record<string, any>;

  // Extra metadata
  // Example:
  // {
  //   browser: "Chrome",
  //   ip: "127.0.0.1"
  // }
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  // Notification status
  // Possible values:
  // UNREAD
  // READ
  @Prop({
    enum: NOTIFICATION_STATUS,
    default: NOTIFICATION_STATUS.UNREAD,
  })
  status: string;

  // Notification importance level
  // Possible values:
  // LOW
  // MEDIUM
  // HIGH
  @Prop({
    enum: NOTIFICATION_PRIORITY,
    default: NOTIFICATION_PRIORITY.MEDIUM,
  })
  priority: string;

  // Expiry date/time
  // Example:
  // "2026-07-01T00:00:00Z"
  @Prop({ type: String, default: null })
  expiresAt: string;

  // Frontend redirect URL
  // Example:
  // "/tasks/123"
  @Prop({ type: String, default: null })
  redirectUrl: string;
}

// Convert class into MongoDB schema
export const NotificationSchema = SchemaFactory.createForClass(Notification);
