import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';
import { Columns } from './columns.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class TasksHistory extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  @Prop()
  message: string;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Columns.name })
  // colFrom: Columns;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Columns.name })
  // colTo: Columns;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Tasks.name })
  taskId: Tasks;
}

export const tasksHistorySchema = SchemaFactory.createForClass(TasksHistory);
