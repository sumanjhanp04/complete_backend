import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { connection, Document } from 'mongoose';
import { Tasks, tasksSchema } from './tasks.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Columns extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Tasks.name }] })
  tasks: Tasks[];
}

export const columnsSchema = SchemaFactory.createForClass(Columns);

columnsSchema.pre("deleteOne", { document: false, query: true }, async function(next){
  
  const columns = await this.model.findOne(this.getFilter());
  
  if(columns?.tasks?.length){

    const taskModel = this.model.db.models.Tasks;
    await taskModel.deleteMany({
      _id:{$in: columns.tasks}
    })
    // console.log("task delete successfully");
    
  }
  next();
})

