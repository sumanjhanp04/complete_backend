import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Columns } from './columns.schema';
import { Projects } from './projects.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Boards extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  admin: User;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
  assignedUser: User[] | [];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Columns.name }] })
  columns: Columns[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Projects.name })
  project: string;
}

export const boardsSchema = SchemaFactory.createForClass(Boards);
