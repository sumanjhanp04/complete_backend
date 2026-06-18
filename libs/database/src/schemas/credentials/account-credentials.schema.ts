import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../authentication/user.schema';
// import { Credentials } from './credentials.schema';

export type AccountCredentialsDocument = AccountCredentials & Document;

@Schema({ timestamps: true, versionKey: false })
export class AccountCredentials {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Credentials',
    required: true,
  })
  credentialsId: MongooseSchema.Types.ObjectId; // Reference to Credentials table

  @Prop({ required: true })
  username: string; // Account username

  @Prop({ required: true })
  password: string; // Account password
  @Prop()
  note: string; // Account password

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        userId: {
          type: MongooseSchema.Types.ObjectId,
          ref: User.name,
          required: true,
        },
        accessLevel: {
          type: String,
          required: true,
          enum: ['read', 'write'], // Restrict access levels
        },
      },
    ],
    required: false,
    default: [],
  })
  sharedWith?: { userId: string; accessLevel: string }[]; // Users who can access this account credential

}

export const AccountCredentialsSchema =
  SchemaFactory.createForClass(AccountCredentials);
