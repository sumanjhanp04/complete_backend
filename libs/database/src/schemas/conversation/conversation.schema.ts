import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Room } from './room.schema';
import { Seen } from './seen.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Conversation extends Document {
  @Prop()
  message: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  sender: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Conversation.name })
  replyFor?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Seen.name }] })
  seenBy: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Room.name })
  roomId: string;

  @Prop()
  messageEditTime?: Date;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isDelivered: boolean;

  @Prop({ default: [] })
  file?: string[] | [];
}

export const conversationSchema = SchemaFactory.createForClass(Conversation);
