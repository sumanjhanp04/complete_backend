import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
    timestamps: true,
    versionKey: false
})
export class Shift {
    @Prop({type:String,required:true})
    shiftName: string

    @Prop({type:String,required:true})
    shiftStartTime: string

    @Prop({type:String,required:true})
    shiftBreakTime: string

    @Prop({type:String,required:true})
    shiftEndTime: string

    @Prop({type:String,required:false})
    color:string;

}

export interface ShiftDocument extends Shift, Document { }

export const ShiftSchema = SchemaFactory.createForClass(Shift);