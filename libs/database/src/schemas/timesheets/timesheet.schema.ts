import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Employee } from "../employees/employee.schema";
import { STATUS } from "../consts/consts.schema";

export type TimeSheetDocument = TimeSheet & Document;

@Schema({timestamps:true})
export class TimeSheet{
@Prop({required:true})
content:string

@Prop({required:true,type:mongoose.Schema.Types.ObjectId, ref:Employee.name})
userId:string

@Prop({required:true})
duration:string

@Prop({require:true})
submitDate:string

@Prop({ required: true, enum: STATUS, default:STATUS.PENDING })
status: string;

@Prop({type:mongoose.Schema.Types.ObjectId, ref:Employee.name})
approveBy:string;

@Prop()
approveAt:string;
}

export const TimeSheetSchema = SchemaFactory.createForClass(TimeSheet)