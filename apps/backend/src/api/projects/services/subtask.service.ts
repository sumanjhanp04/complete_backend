import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubtaskDto, UpdateSubtaskDto, } from '@lib/dto';
import { SubTasks } from '@lib/database';
import { USER_POPULATION_FIELDS } from '@lib/common';

@Injectable()
export class SubTasksService {
    private readonly logger = new Logger(SubTasksService.name);
    constructor(
        @InjectModel(SubTasks.name) private readonly subtaskModel: Model<SubTasks>,
    ) { }



    // create a subtask
    async createSubtask(subtask: CreateSubtaskDto) {
        const newSubtask = new this.subtaskModel(subtask);
        return await newSubtask.save();
    }


    // fetch all subtasks
    async getAllSubtasks(query: { task: string, user: string }) {
        const { task, user } = query;
        const queryFilter = { task };
        if (user && user !== '') {
            queryFilter['assignedTo'] = user;
        }



        return await this.subtaskModel.find(queryFilter).populate({
            path: 'assignedTo createdBy updatedBy',
            select: 'userId userIdRef',
            populate: {
                path: 'userId',
                select: USER_POPULATION_FIELDS,
            },
        }).sort({
            isCompleted: 1
        }).exec()
    }


    async updateSubtasks(id: string, updateSubtask: UpdateSubtaskDto) {
        this.logger.debug("update the subtask is calling")
        this.logger.log({id, ...updateSubtask})
        // suppose from col - 1 :id
        // suppose form col - 2 :id 
        
        return await this.subtaskModel.findByIdAndUpdate(id, updateSubtask)
    }

    async deleteSubtasks(id: string) {
        return await this.subtaskModel.findByIdAndDelete(id);
    }
}
