// Import decorators for creating MongoDB schemas
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import mongoose and Document class
import mongoose, { Document } from 'mongoose';

// Import related schemas
import { User } from '../authentication/user.schema';
import { Columns } from './columns.schema';
import { Projects } from './projects.schema';

// Schema configuration
@Schema({
  timestamps: true, // Adds createdAt and updatedAt automatically
  versionKey: false, // Removes __v field
})

// Boards collection schema
export class Boards extends Document {
  // Board name
  // Example: "Backend Development Board"
  @Prop({ required: true })
  name: string;

  // Optional board description
  // Example: "Tasks related to backend APIs"
  @Prop()
  description?: string;

  // Board administrator
  // User who created or manages the board
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  admin: User;

  // Users assigned to this board
  // Multiple users can be members of a board
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
  })
  assignedUser: User[] | [];

  // Columns inside board
  // Example:
  // To Do
  // In Progress
  // Testing
  // Done
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Columns.name,
      },
    ],
  })
  columns: Columns[];

  // Board belongs to a project
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
  })
  project: string;
}

// Convert class into mongoose schema
export const boardsSchema = SchemaFactory.createForClass(Boards);
