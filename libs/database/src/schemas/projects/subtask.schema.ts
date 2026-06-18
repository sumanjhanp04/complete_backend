import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { User } from "../authentication/user.schema";
import { Tasks } from "./tasks.schema";

export type SubTasksDocument = SubTasks & Document;
@Schema({
  timestamps: true,
  versionKey: false,
})
export class SubTasks {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Tasks.name })
  task: string

  @Prop({ default: false })
  isCompleted: boolean

  @Prop({ required: false, default: null, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  assignedTo?: string | null;


  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  updatedBy?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createdBy: string;
}

export const SubTasksSchema = SchemaFactory.createForClass(SubTasks);
