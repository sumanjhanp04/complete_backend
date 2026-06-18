import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, mongo, Mongoose } from 'mongoose';
import { CreateSubtaskDto, CreateTaskDto, ListQueryDTO, UpdateTaskDto } from '@lib/dto';
import { Boards, Columns, Projects, SubTasks, TASK_PRIORITY, Tasks, TasksHistory } from '@lib/database';
import {findFieldName, flattenObject, USER_POPULATION_FIELDS } from '@lib/common';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(SubTasks.name) private readonly subtaskModel: Model<SubTasks>,
    @InjectModel(Tasks.name) private readonly tasksModel: Model<Tasks>,
    @InjectModel(Columns.name) private readonly columnModel: Model<Columns>,
    @InjectModel(Boards.name) private readonly boardsModel: Model<Boards>,
    @InjectModel(Projects.name) private readonly projectsModel: Model<Projects>,
    @InjectModel(TasksHistory.name)
    private readonly taskHistoryModel: Model<TasksHistory>,
  ) { }

  private readonly logger = new Logger(TasksService.name);

  async createTask(createTaskDto: CreateTaskDto, col: string) {
    const newTask = new this.tasksModel(createTaskDto);
    const d = await newTask.save();
    const task = await this.columnModel.findByIdAndUpdate(col, {
      $push: { tasks: d._id },
    });
    await this.taskHistoryModel.create({
      createdBy: d?.createdBy,
      taskId: d?._id,
      message: `Task  has been successfully created at column ${task.name}`,
    });
    return d;
  }

  // READ (List) all Tasks
  async listAllTasks() {
    const data = await this.tasksModel.find().exec();
    return data;
  }

  // READ (Get) a single Task
  async getTaskById(id: string) {
    const data = await this.tasksModel
      .findById(id)
      .populate({
        path: 'createdBy updatedBy assignedUser',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: USER_POPULATION_FIELDS,
        },
      })
      .exec();
    if (!data) {
      throw new NotFoundException('Task Not Found');
    }
    return data;
  }

  async getTasksByUser(
    userId: string,
    completedTasks: boolean | string = false,
    { limit = 10, page = 1, keyword, sort = 'desc', sortBy = 'priority' }: ListQueryDTO,
  ) {
    const skip = (page - 1) * limit;
    // this.logger.log(completedTasks)

    const isCompleted = completedTasks === 'true' || completedTasks === true;
    // this.logger.log({isCompleted}) 

    let query: any = {
      assignedUser: new mongoose.Types.ObjectId(userId),
      isCompleted: isCompleted,
    };


    // Apply keyword search if provided
    if (keyword) {
      query = { ...query, name: { $regex: keyword, $options: 'i' } };
    }

    this.logger.log({sortBy})

    const tasks = await this.tasksModel.aggregate([
      { $match: query },
      {
        $addFields: {
          priorityIndex: { $indexOfArray: [TASK_PRIORITY, '$priority'] },
        },
      },
      {
        $sort: {
          ...(sortBy === 'priority'
            ? { priorityIndex: sort === 'asc' ? 1 : -1 }
            : { [sortBy]: sort === 'asc' ? 1 : -1 }),
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // this.logger.debug(`Tasks: ${tasks}`);


    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const column = await this.columnModel.findOne({ tasks: task._id }).exec();
        const board = await this.boardsModel.findOne({ columns: column._id }).exec();
        const project = await this.projectsModel.findById(board.project).exec();

        return {
          task,
          column: {
            _id: column._id,
            name: column.name,
          },
          board: {
            _id: board._id,
            name: board.name,
          },
          project: {
            _id: project._id,
            name: project.name,
          },
        };
      }),
    );

    // this.logger.log(tasksWithDetails)

    const totalTasks = await this.tasksModel.countDocuments(query).exec();

    return {
      data: tasksWithDetails,
      pagination: {
        total: totalTasks,
        count: tasks.length,
      },
    };
  }

  async changeTaskColumn(
    board: string,
    colFrom: string,
    colTo: string,
    task: string,
    user: string,
  ) {
    const tsk = await this.tasksModel.findByIdAndUpdate(task, {
      updatedBy: user,
    });
    const d1 = await this.columnModel.findByIdAndUpdate(colFrom, {
      $pull: { tasks: task },
    });
    const d2 = await this.columnModel.findByIdAndUpdate(colTo, {
      $push: { tasks: task },
    });

    if (!d1 || !d2) {
      return { message: 'Something went wrong', success: false };
    }

    const brd = await this.boardsModel
      .findById(board)
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

    return brd;
  }

  // UPDATE Task
  async updateTask(id: string, updateTaskDto: UpdateTaskDto) {
    const previousTask = await this.tasksModel.findById(id).populate({
      path: 'createdBy updatedBy assignedUser',
      select: 'userId userIdRef',
      populate: {
        path: 'userId',
        select: 'firstName lastName image',
      },
    });
    const updatedTask = await (
      await this.tasksModel.findByIdAndUpdate(id, updateTaskDto, {
        new: true,
      })
    ).populate({
      path: 'createdBy updatedBy assignedUser',
      select: 'userId userIdRef',
      populate: {
        path: 'userId',
        select: 'firstName lastName image',
      },
    });
    if (!updatedTask) {
      throw new NotFoundException('Task Not Found');
    }

    const message = this.checkChangeFields(
      updatedTask?.toObject(),
      previousTask?.toObject(),
    );

    if (message && message !== '') {
      await this.taskHistoryModel.create({
        createdBy: updateTaskDto?.updatedBy,
        taskId: id,
        message: message,
      });
    }
    return updatedTask;
  }

  // DELETE Task
  async deleteTask(id: string, column?: string) {
    try {
      const result = await this.tasksModel.findByIdAndDelete(id).exec();
      if (!result) {
        return { message: 'Task not found.', success: false };
      }
      if (column) {
        const updatedCol = await this.columnModel
          .findByIdAndUpdate(column, { $pull: { tasks: id } }, { new: true })
          .populate('tasks');
        return {
          message: 'Task deleted successfully.',
          success: true,
          data: updatedCol,
        };
      }
      await this.taskHistoryModel.deleteMany({ taskId: id });
      return { message: 'Task deleted successfully.', success: true };
    } catch (err) {
      return { message: "Something isn't right!", success: false, err };
    }
  }

  // create a subtask
  async createSubtask(task: string, subtask: CreateSubtaskDto) {
    const newSubtask = new this.subtaskModel(subtask);
    await newSubtask.save();

    return await this.tasksModel.findByIdAndUpdate(
      task,
      {
        $push: {
          subtasks: newSubtask._id,
        },
      },
      { new: true },
    );
  }

  async getAllTaskHistory(taskId: string) {
    const taskHistory = await this.taskHistoryModel
      .find({ taskId: taskId })
      .populate({
        path: 'createdBy',
        populate: {
          path: 'userId',
        },
      })
      .sort({ createdAt: -1 });
    return taskHistory;
  }

  private checkChangeFields(updatedData, oldData, name = null) {
    updatedData = flattenObject(updatedData);
    oldData = flattenObject(oldData);

    const changedFields = [];

    for (const key in updatedData) {
      let oldValue = oldData[key] !== undefined ? oldData[key] : '';
      let updatedValue = updatedData[key];

      const fieldName = findFieldName(key, name);

      // Handle array comparison (e.g., arrays of populated ObjectIds)
      if (Array.isArray(updatedValue)) {
        // Convert arrays to string representations to compare them
        const oldArrayValue = oldValue
          .map((item) => item?.userId?.firstName)
          .join(',');
        const updatedArrayValue = updatedValue
          .map((item) => item?.userId?.firstName)
          .join(',');

        // Compare arrays as strings after sorting
        if (oldArrayValue !== updatedArrayValue) {
          changedFields.push(
            `<br>${fieldName}: ${oldArrayValue} to ${updatedArrayValue}<br>`,
          );
        }
      } else {
        // Handle normal field comparison
        oldValue = oldValue !== undefined ? String(oldValue).trim() : '';
        updatedValue = String(updatedValue).trim();

        if (fieldName && oldValue !== updatedValue) {
          changedFields.push(
            `<br>${fieldName}: ${oldValue} to ${updatedValue}<br>`,
          );
        }
      }
    }

    const logMessage =
      changedFields.length > 0 && `Task Updated : ${changedFields.join('')}`;

    return logMessage;
  }
}
