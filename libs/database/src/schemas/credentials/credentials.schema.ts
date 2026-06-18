import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Schema as MongooseSchema } from 'mongoose';
import { AccountCredentials } from './account-credentials.schema';
import { User } from '../authentication/user.schema';
export type CredentialsDocument = Credentials & Document;

@Schema({ timestamps: true, versionKey: false })
export class Credentials {

  @Prop({ required: true })
  name: string; // Service name like Google or Facebook

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true })
  url: string; // Service URL

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: MongooseSchema.Types.ObjectId; // Service URL

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
  sharedWith?: { userId: string; accessLevel: string }[];

  @Prop({
    type: [
      { type: MongooseSchema.Types.ObjectId, ref: AccountCredentials.name },
    ],
  })
  accountCredentials?: string[];
}

export const CredentialsSchema = SchemaFactory.createForClass(Credentials);
