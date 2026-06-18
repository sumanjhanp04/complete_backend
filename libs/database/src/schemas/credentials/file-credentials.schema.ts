import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';

export type FileCredentialDocument = FileCredential & Document;

@Schema({ timestamps: true }) // Adds createdAt and updatedAt fields automatically
export class FileCredential {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  size: number;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: string;

  @Prop({ required: true })
  path: string;

  @Prop({
    type: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: User.name,
          required: true
        },
        accessLevel: {
          type: String,
          required: true,
          enum: ['read', 'write'], // Restrict access levels
        },
      },
    ],
    required: false,
    default: [],
  })
  sharedWith?: { userId: string; accessLevel: string }[];
}

export const FileCredentialSchema =
  SchemaFactory.createForClass(FileCredential);

// // Add an index on fields if needed
// FileCredentialSchema.index({ createdBy: 1 });
