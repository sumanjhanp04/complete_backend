import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Company } from '../clients/company.schema';
import { ProjectCategory, ProjectSubCategory } from './projectCategory.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Projects extends Document {
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

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectCategory.name
  })
  //category: mongoose.Types.ObjectId | ProjectCategory
  category: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectSubCategory.name
  })
  subCategory: string


  @Prop()
  startDate: string;

  @Prop()
  endDate: string;

  @Prop({ required: true, default: true })
  status: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Company.name })
  company: Company | null;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    ref: User.name,
  })
  assignedUser: User[] | [];
}

export const projectsSchema = SchemaFactory.createForClass(Projects);
