import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, SchemaTypes, mongo } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Projects } from './projects.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ProjectsHistory extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  @Prop()
  message: string;

  @Prop()
  time: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Projects.name })
  projectID: Projects;
}

export const projectsHistorySchema =
  SchemaFactory.createForClass(ProjectsHistory);
