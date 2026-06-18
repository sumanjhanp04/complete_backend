import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MonSchema } from 'mongoose';
import { USER_REF, USER_TYPES } from '../consts/consts.schema';
import * as bcrypt from 'bcryptjs';
import { Shift } from '../employees/shift.schema';

export type UserDocument = User & Document;
@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    type: MonSchema.Types.ObjectId,
    required: true,
    refPath: 'userIdRef',
    unique: true,
  })
  userId: MonSchema.Types.ObjectId;

  @Prop({ required: true, enum: USER_REF })
  userIdRef: string;

  @Prop({ required: true, enum: USER_TYPES })
  userType: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  wantReset: boolean;

  @Prop({ default: '' })
  secret: string;

  @Prop({ default: false })
  workfromhome: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Shift.name,
    default: null,
  })
  shift: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: false })
  isManager: boolean;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
  assignedUsers?: string[];
  @Prop({ default: 1024 * 1024 * 1024 }) // 1 GB in bytes
  allocatedSpace: number;
}

export const userSchema = SchemaFactory.createForClass(User);

userSchema.pre<UserDocument>('save', async function (next) {
  // console.log(`Password is : ${this.password}`);
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
  // console.log(`Password is : ${this.password}`);
  next();
});
