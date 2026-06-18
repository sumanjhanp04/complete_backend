import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { TASK_PRIORITY } from '../consts/consts.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Tasks extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    ref: User.name,
    default: [],
  })
  assignedUser: User[] | [];

  @Prop({ default: null })
  duration?: number | null;

  @Prop({
    default: false
  })
  isCompleted: boolean;

  @Prop({ enum: TASK_PRIORITY, default: 'normal' })
  priority: string;

  // @Prop({ type:String, default: null })
  // tags: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  updatedBy?: User | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createdBy?: User | null;
}

export const tasksSchema = SchemaFactory.createForClass(Tasks);
