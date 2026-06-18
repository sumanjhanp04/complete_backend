import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { User } from "./user.schema";

export type TeamsDocument = Teams & Document;
@Schema({
    timestamps: true,
    versionKey: false
})
export class Teams {
    @Prop()
    name: string;

    @Prop({ default: true })
    isActive: boolean

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
    teamLead: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }], default: [] })
    members: string[];


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
    createdBy: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: false, default: null })
    updatedBy: string | null;

}

export const TeamsSchema = SchemaFactory.createForClass(Teams);