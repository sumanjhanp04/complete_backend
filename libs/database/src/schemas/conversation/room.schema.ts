import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../authentication/user.schema';
import { Projects } from '../projects/projects.schema';

export type RoomDocument = Room & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Room {
  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  creator: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Projects.name })
  project?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    required: true,
    validate: {
      validator: function (members: mongoose.Types.ObjectId[]) {
        // If isGroup is true, allow more than 2 members
        if (this.isGroup) {
          return members.length > 1;
        }
        // Otherwise, only allow up to 2 members
        return members.length === 2;
      },
      message: function () {
        return this.isGroup
          ? 'A group must have more than 2 members.'
          : 'A non-group conversation must have exactly 2 members.';
      },
    },
  })
  members: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({
    type:[{type: mongoose.Schema.Types.ObjectId,
      ref: User.name}],
    validate: {
      validator: function (this: RoomDocument) {
        return !this.isGroup || !!this.admin;
      },
      message: 'Admin is required if isGroup is true',
    },
  })
  admin: mongoose.Types.ObjectId[];

  @Prop()
  groupProfile?:string;
  
}

const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.pre('validate', function (next) {
  if (this.isGroup) {
    if (!this.name) {
      next(new Error('Name is required if isGroup is true'));
    } else if (!this.description) {
      next(new Error('Description is required if isGroup is true'));
    } else {
      next();
    }
  } else {
    next();
  }
});

export default RoomSchema;
