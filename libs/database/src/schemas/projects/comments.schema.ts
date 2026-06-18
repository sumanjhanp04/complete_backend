import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Comments extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  @Prop()
  message?: string;

  @Prop()
  doc?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Tasks.name,
    required: true,
  })
  taskId: Tasks;
}

export const commentsSchema = SchemaFactory.createForClass(Comments);
