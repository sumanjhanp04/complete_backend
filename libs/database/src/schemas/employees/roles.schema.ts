import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Role extends Document {
  @Prop({ required: true })
  roleName: string;

  @Prop({ required: true })
  description: string;
}

export const roleSchema = SchemaFactory.createForClass(Role);
