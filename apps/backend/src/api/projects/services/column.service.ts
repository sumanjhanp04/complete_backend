import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateColumnDto, UpdateColumnDto } from '@lib/dto'; // Assuming you've created these DTOs
import { TasksService } from './task.service';
import { Boards, Columns, Tasks, TasksHistory } from '@lib/database';

@Injectable()
export class ColumnsService {
  private logger = new Logger(ColumnsService.name);
  constructor(
    @InjectModel(Columns.name) private readonly columnsModel: Model<Columns>,
    @InjectModel(Boards.name) private readonly boardsModel: Model<Boards>,
    @InjectModel(TasksHistory.name) private readonly taskHistoryModel: Model<TasksHistory>,
    private readonly taskService: TasksService,
  ) { }

  async createColumn(createColumnDto: CreateColumnDto, board: string) {
    const newColumn = await this.columnsModel.create(createColumnDto);

    // Push the new column's ID to the board's columns array
    const updatedBoard = await this.boardsModel
      .findByIdAndUpdate(
        board,
        { $push: { columns: newColumn._id } },
        { new: true },
      )
      .populate({
        path: 'admin',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
          populate: {
            path: 'createdBy updatedBy assignedUser',
            select: 'userId userIdRef',
            populate: {
              path: 'userId',
              select: 'firstName lastName image gender',
            },
          },
        },
      })
      .exec();
    if (!updatedBoard) throw new NotFoundException('Board Not Found');
    return updatedBoard;
  }

  async getColumnById(id: string) {
    const column = await this.columnsModel
      .findById(id)
      .populate({
        path: 'tasks',
        populate: {
          path: 'createdBy updatedBy assignedUser',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select: 'firstName lastName image gender',
          },
        },
      })
      .exec();
    if (!column) {
      throw new NotFoundException('Column Not Found');
    }
    return column;
  }

  async updateColumn(id: string, updateColumnDto: UpdateColumnDto, taskData?: { colTo: string, colFrom: string, task: string }) {
    this.logger.log(taskData);
    this.logger.log(updateColumnDto)
    const updatedColumn = await this.columnsModel
      .findByIdAndUpdate(id, updateColumnDto, { new: true })
      .populate({
        path: 'tasks',
        populate: {
          path: 'createdBy updatedBy assignedUser',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select: 'firstName lastName image',
          },
        },
      })
      .exec();
    if (!updatedColumn) {
      throw new NotFoundException('Column Not Found');
    }
    

     const updatedColFrom = await this.columnsModel.findByIdAndUpdate(taskData.colFrom, {
      $pull: { tasks: taskData.task },
    },{new:true})
    const updatedColTo =  await this.columnsModel.findByIdAndUpdate(taskData.colTo, {
      $push: { tasks: taskData.task },
    }, {new:true})


    this.logger.log("board is updated")

    if (taskData.task && taskData.colFrom && taskData.colTo) {

      await this.taskHistoryModel.create({
        createdBy: updateColumnDto.updatedBy,
        taskId: taskData?.task,
        // message: `Task's column changed from ${taskData?.colFrom} → ${taskData?.colTo}. `
        message: `Task's column changed from ${updatedColFrom.name} → ${updatedColTo.name}. `
      })
    }

    if (taskData.task && !taskData.colFrom && !taskData.colTo) {
      await this.taskHistoryModel.create({
        createdBy: updateColumnDto.updatedBy,
        taskId: taskData?.task,
        message: `Task position updated in the ${updatedColumn.name} column. `
      })
    }
    return updatedColumn;
  }

  async deleteColumn(id: string, board: string) {
    try {
      
      const delCol = await this.columnsModel.findById(id);
      
      if (!delCol) {
        return { message: 'Error while deleting column', success: false };
      }
      
      // Why we need this
      const updatedBoard = await this.boardsModel
        .findByIdAndUpdate(
          board,
          {
            $pull: { columns: id },
          },
          { new: true },
        )
        .populate({
          path: 'admin',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select: 'firstName lastName image',
          },
        })
        .populate({
          path: 'assignedUser',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select: 'firstName lastName image',
          },
        })
        .populate({
          path: 'columns',
          populate: {
            path: 'tasks',
            populate: {
              path: 'createdBy updatedBy assignedUser',
              select: 'userId userIdRef',
              populate: {
                path: 'userId',
                select: 'firstName lastName image',
              },
            },
          },
        })
        .exec();


        await delCol.deleteOne();

      return {
        message: 'Column deleted successfully.',
        success: true,
        data: updatedBoard,
      };
    } catch (err) {
      return { message: "Something isn't right !", success: false };
    }
  }
}
