import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { EMPLOYEE_TYPES } from '../consts/consts.schema';
import { Designation } from '../masterSchemas/designation.schema';
import { Department } from '../masterSchemas/department.schema';
import { Address } from './address.schema';
import { EmergencyContact } from './emergencyContact.schema';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Employee extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  mobile: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: ['Male', 'Female', 'Others'] })
  gender: string;

  @Prop({ required: true })
  dob: Date;

  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true })
  dateJoined: Date;

  @Prop({ required: true, enum: EMPLOYEE_TYPES })
  role: string;

  @Prop({ default: false })
  isManager: boolean;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Department.name,
  })
  department: mongoose.Schema.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Designation.name,
  })
  designation: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  })
  reportsTo: string;

  @Prop()
  image?: string;

  @Prop()
  banner?: string;

  @Prop({ type: [String], default: [] })
  alternativePhNos: string[];

  @Prop({ type: [String], default: [] })
  alternativeEmailIds: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Address' })
  permanentAddress?: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Address.name,
  })
  currentAddress?: mongoose.Schema.Types.ObjectId;
  @Prop({ type: Boolean, default: false })
  sameAsPermanentAddress: boolean;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: EmergencyContact.name },
    ],
    default: [],
  })
  emergencyContacts: mongoose.Schema.Types.ObjectId[];
}

export const employeeSchema = SchemaFactory.createForClass(Employee);
