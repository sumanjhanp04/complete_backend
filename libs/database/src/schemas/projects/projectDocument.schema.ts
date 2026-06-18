import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';
import { Projects } from './projects.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ProjectDocument extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  @Prop()
  name: string;

  @Prop({ required: true })
  document: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
    required: true,
  })
  project: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    validate: {
      validator: function () {
        // If isPublic is false, members field is required and should not be empty
        return (
          !this.isPublic ||
          (this.isPublic && this.members && this.members.length > 0)
        );
      },
      message: 'Members field is required when isPublic is false.',
    },
  })
  members: string[];
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ProjectCredential extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop()
  username: string;

  @Prop()
  password: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
    required: true,
  })
  project: string;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true },
    ],
  })
  members: string[];
}

export const projectDocumentSchema =
  SchemaFactory.createForClass(ProjectDocument);
export const projectCredentialSchema =
  SchemaFactory.createForClass(ProjectCredential);
