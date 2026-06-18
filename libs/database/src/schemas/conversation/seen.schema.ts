import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';

export type SeenDocument = Seen & Document;
@Schema({
  timestamps: true,
  versionKey: false,
})
export class Seen {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: string;
}

export const SeenSchema = SchemaFactory.createForClass(Seen);
