// Import decorators used to create MongoDB schemas in NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import mongoose and Document class
import mongoose, { Document } from 'mongoose';

// Import other schemas for relationships (references)
import { User } from '../authentication/user.schema';
import { Tasks } from './tasks.schema';
import { Projects } from './projects.schema';

/*
|--------------------------------------------------------------------------
| PROJECT DOCUMENT SCHEMA
|--------------------------------------------------------------------------
| This collection stores project-related documents/files.
| Example:
| {
|   name: "Project Requirements",
|   document: "https://s3.amazonaws.com/file.pdf",
|   project: ObjectId("123"),
|   createdBy: ObjectId("456")
| }
|--------------------------------------------------------------------------
*/

// Create schema with automatic createdAt and updatedAt fields
@Schema({
  timestamps: true,
  versionKey: false, // removes __v field
})
export class ProjectDocument extends Document {
  // User who uploaded/created this document
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name, // Reference to User collection
  })
  createdBy: User;

  // Document name/title
  @Prop()
  name: string;

  // File URL/path
  @Prop({ required: true })
  document: string;

  // Project to which this document belongs
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
    required: true,
  })
  project: string;

  // Public document or private document
  @Prop({ default: false })
  isPublic: boolean;

  /*
   * List of users who can access this document.
   * Stored as array of User ObjectIds.
   */
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],

    validate: {
      validator: function () {
        /*
         * Validation Logic
         *
         * If document is private (isPublic = false),
         * members must exist and contain users.
         *
         * If document is public,
         * members can be empty.
         */

        return (
          !this.isPublic ||
          (this.isPublic && this.members && this.members.length > 0)
        );
      },

      message: 'Members field is required when isPublic is false.',
    },
  })
  members: string[];
}

/*
|--------------------------------------------------------------------------
| PROJECT CREDENTIAL SCHEMA
|--------------------------------------------------------------------------
| Stores project credentials such as:
| - Website URL
| - Username
| - Password
|
| Example:
| {
|   name: "AWS Account",
|   url: "aws.amazon.com",
|   username: "admin@gmail.com",
|   password: "******",
|   project: ObjectId(...)
| }
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ProjectCredential extends Document {
  // User who created this credential
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: User;

  // Credential name
  @Prop()
  name: string;

  // Website URL
  @Prop()
  url: string;

  // Login username/email
  @Prop()
  username: string;

  // Login password
  @Prop()
  password: string;

  // Associated project
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Projects.name,
    required: true,
  })
  project: string;

  /*
   * Users allowed to view this credential
   */
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
        required: true,
      },
    ],
  })
  members: string[];
}

/*
|--------------------------------------------------------------------------
| Convert Classes into Mongoose Schemas
|--------------------------------------------------------------------------
| NestJS uses these schemas to create MongoDB collections.
|--------------------------------------------------------------------------
*/

export const projectDocumentSchema =
  SchemaFactory.createForClass(ProjectDocument);

export const projectCredentialSchema =
  SchemaFactory.createForClass(ProjectCredential);
