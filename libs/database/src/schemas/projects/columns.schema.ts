// Import decorators for schema creation
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Import mongoose and Document class
import mongoose, { connection, Document } from 'mongoose';

// Import Task schema
import { Tasks, tasksSchema } from './tasks.schema';

// Create MongoDB Schema
@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false, // Removes __v field
})
export class Columns extends Document {
  // Column name
  // Example:
  // To Do
  // In Progress
  // Done
  @Prop({ required: true })
  name: string;

  // Optional description
  @Prop()
  description?: string;

  // Array of task IDs belonging to this column
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Tasks.name,
      },
    ],
  })
  tasks: Tasks[];
}

// Convert class into Mongoose Schema
export const columnsSchema = SchemaFactory.createForClass(Columns);

// =========================================
// MONGOOSE PRE DELETE HOOK
// =========================================

// Runs BEFORE deleteOne() executes
columnsSchema.pre(
  'deleteOne',
  {
    document: false,
    query: true,
  },
  async function (next) {
    // Find the column being deleted
    const columns = await this.model.findOne(this.getFilter());

    // Check if column contains tasks
    if (columns?.tasks?.length) {
      // Get Task model
      const taskModel = this.model.db.models.Tasks;

      // Delete all tasks belonging to column
      await taskModel.deleteMany({
        _id: {
          $in: columns.tasks,
        },
      });

      // console.log("task delete successfully");
    }

    // Continue deletion process
    next();
  },
);
