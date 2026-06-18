import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";
import { User } from "../authentication/user.schema";

export type ProjectCategoryDocument = ProjectCategory & Document;
@Schema({
    timestamps: true,
    versionKey: false
})
export class ProjectCategory {

    @Prop()
    name: string;

    @Prop()
    description?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
    createdBy: string
}

export const ProjectCategorySchema = SchemaFactory.createForClass(ProjectCategory);



export type ProjectSubCategoryDocument = ProjectSubCategory & Document;
@Schema({
    timestamps: true,
    versionKey: false
})
export class ProjectSubCategory {
    @Prop()
    name: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: ProjectCategory.name, required: true })
    category: string


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
    createdBy: string
}

export const ProjectSubCategorySchema = SchemaFactory.createForClass(ProjectSubCategory);