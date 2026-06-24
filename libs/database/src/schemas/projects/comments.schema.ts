// Import decorators for creating MongoDB schemas
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import mongoose and Document class
import mongoose, { Document } from 'mongoose';

// Import User schema
import { User } from '../authentication/user.schema';

// Import Task schema
import { Tasks } from './tasks.schema';

// Schema configuration
@Schema({
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false, // Removes __v field
})
export class Comments extends Document {
  // User who created the comment
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  // Comment text/message
  // Example:
  // "Login API completed"
  @Prop()
  message?: string;

  // File/document attached with comment
  // Example:
  // "https://s3.amazonaws.com/file.pdf"
  @Prop()
  doc?: string;

  // Task on which comment is posted
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Tasks.name,
    required: true,
  })
  taskId: Tasks;
}

// Convert class into mongoose schema
export const commentsSchema = SchemaFactory.createForClass(Comments);
