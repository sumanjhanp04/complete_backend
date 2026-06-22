import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

// DTOs
import { CreateColumnDto, UpdateColumnDto } from '@lib/dto';

// Services
import { TasksService } from './task.service';

// Database Schemas
import {
  Boards,
  Columns,
  Tasks,
  TasksHistory,
} from '@lib/database';

/**
 * ColumnsService
 *
 * Responsible for:
 * - Creating Columns
 * - Retrieving Columns
 * - Updating Columns
 * - Moving Tasks Between Columns
 * - Maintaining Task History
 * - Deleting Columns
 *
 * Structure:
 *
 * Board
 *   ├── Todo
 *   ├── In Progress
 *   ├── Testing
 *   └── Done
 *
 * Each Column
 *   └── Tasks
 */
@Injectable()
export class ColumnsService {
  /**
   * Logger used for debugging
   */
  private logger = new Logger(ColumnsService.name);

  constructor(
    /**
     * Column Collection
     */
    @InjectModel(Columns.name)
    private readonly columnsModel: Model<Columns>,

    /**
     * Board Collection
     */
    @InjectModel(Boards.name)
    private readonly boardsModel: Model<Boards>,

    /**
     * Task History Collection
     */
    @InjectModel(TasksHistory.name)
    private readonly taskHistoryModel: Model<TasksHistory>,

    /**
     * Task Service
     */
    private readonly taskService: TasksService,
  ) { }

  // ============================================================
  // CREATE COLUMN
  // ============================================================

  /**
   * Creates a new column and attaches it to a board.
   *
   * Example:
   * Board:
   * Development Board
   *
   * New Column:
   * Testing
   */
  async createColumn(
    createColumnDto: CreateColumnDto,
    board: string,
  ) {
    /**
     * Create new column document
     */
    const newColumn =
      await this.columnsModel.create(
        createColumnDto,
      );

    /**
     * Push column id into board.columns array
     */
    const updatedBoard =
      await this.boardsModel
        .findByIdAndUpdate(
          board,
          {
            $push: {
              columns: newColumn._id,
            },
          },
          {
            new: true,
          },
        )

        /**
         * Populate Admin
         */
        .populate({
          path: 'admin',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select:
              'firstName lastName image gender',
          },
        })

        /**
         * Populate Assigned Users
         */
        .populate({
          path: 'assignedUser',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select:
              'firstName lastName image gender',
          },
        })

        /**
         * Populate Columns & Tasks
         */
        .populate({
          path: 'columns',
          populate: {
            path: 'tasks',
            populate: {
              path:
                'createdBy updatedBy assignedUser',
              select: 'userId userIdRef',
              populate: {
                path: 'userId',
                select:
                  'firstName lastName image gender',
              },
            },
          },
        })

        .exec();

    /**
     * Board not found
     */
    if (!updatedBoard) {
      throw new NotFoundException(
        'Board Not Found',
      );
    }

    return updatedBoard;
  }

  // ============================================================
  // GET COLUMN BY ID
  // ============================================================

  /**
   * Returns a single column with all tasks.
   */
  async getColumnById(id: string) {
    const column = await this.columnsModel
      .findById(id)

      /**
       * Populate Tasks
       */
      .populate({
        path: 'tasks',
        populate: {
          path:
            'createdBy updatedBy assignedUser',
          select: 'userId userIdRef',
          populate: {
            path: 'userId',
            select:
              'firstName lastName image gender',
          },
        },
      })

      .exec();

    if (!column) {
      throw new NotFoundException(
        'Column Not Found',
      );
    }

    return column;
  }

  // ============================================================
  // UPDATE COLUMN
  // ============================================================

  /**
   * Updates column details.
   *
   * Also handles:
   * - Task movement
   * - Task reordering
   * - Task history tracking
   */
  async updateColumn(
    id: string,
    updateColumnDto: UpdateColumnDto,
    taskData?: {
      colTo: string;
      colFrom: string;
      task: string;
    },
  ) {
    /**
     * Debug Logs
     */
    this.logger.log(taskData);
    this.logger.log(updateColumnDto);

    /**
     * Update column
     */
    const updatedColumn =
      await this.columnsModel
        .findByIdAndUpdate(
          id,
          updateColumnDto,
          {
            new: true,
          },
        )

        .populate({
          path: 'tasks',
          populate: {
            path:
              'createdBy updatedBy assignedUser',
            select: 'userId userIdRef',
            populate: {
              path: 'userId',
              select:
                'firstName lastName image',
            },
          },
        })

        .exec();

    if (!updatedColumn) {
      throw new NotFoundException(
        'Column Not Found',
      );
    }

    /**
     * Remove task from source column
     */
    const updatedColFrom =
      await this.columnsModel.findByIdAndUpdate(
        taskData.colFrom,
        {
          $pull: {
            tasks: taskData.task,
          },
        },
        {
          new: true,
        },
      );

    /**
     * Add task into destination column
     */
    const updatedColTo =
      await this.columnsModel.findByIdAndUpdate(
        taskData.colTo,
        {
          $push: {
            tasks: taskData.task,
          },
        },
        {
          new: true,
        },
      );

    this.logger.log(
      'Board is updated successfully',
    );

    // ========================================================
    // TASK MOVED BETWEEN COLUMNS
    // ========================================================

    /**
     * Example:
     *
     * Todo
     *   ↓
     * In Progress
     */
    if (
      taskData.task &&
      taskData.colFrom &&
      taskData.colTo
    ) {
      await this.taskHistoryModel.create({
        createdBy:
          updateColumnDto.updatedBy,

        taskId: taskData.task,

        message: `Task's column changed from ${updatedColFrom.name} → ${updatedColTo.name}.`,
      });
    }

    // ========================================================
    // TASK POSITION CHANGED INSIDE SAME COLUMN
    // ========================================================

    /**
     * Example:
     *
     * Task moved from
     * Position 1 → Position 3
     *
     * inside same column
     */
    if (
      taskData.task &&
      !taskData.colFrom &&
      !taskData.colTo
    ) {
      await this.taskHistoryModel.create({
        createdBy:
          updateColumnDto.updatedBy,

        taskId: taskData.task,

        message: `Task position updated in the ${updatedColumn.name} column.`,
      });
    }

    return updatedColumn;
  }

  // ============================================================
  // DELETE COLUMN
  // ============================================================

  /**
   * Deletes a column from board.
   *
   * Steps:
   * 1. Find Column
   * 2. Remove column from board
   * 3. Delete column document
   * 4. Return updated board
   */
  async deleteColumn(
    id: string,
    board: string,
  ) {
    try {
      /**
       * Find Column
       */
      const delCol =
        await this.columnsModel.findById(id);

      if (!delCol) {
        return {
          message:
            'Error while deleting column',
          success: false,
        };
      }

      /**
       * Remove column reference
       * from board.columns array
       */
      const updatedBoard =
        await this.boardsModel
          .findByIdAndUpdate(
            board,
            {
              $pull: {
                columns: id,
              },
            },
            {
              new: true,
            },
          )

          .populate({
            path: 'admin',
            select: 'userId userIdRef',
            populate: {
              path: 'userId',
              select:
                'firstName lastName image',
            },
          })

          .populate({
            path: 'assignedUser',
            select: 'userId userIdRef',
            populate: {
              path: 'userId',
              select:
                'firstName lastName image',
            },
          })

          .populate({
            path: 'columns',
            populate: {
              path: 'tasks',
              populate: {
                path:
                  'createdBy updatedBy assignedUser',
                select: 'userId userIdRef',
                populate: {
                  path: 'userId',
                  select:
                    'firstName lastName image',
                },
              },
            },
          })

          .exec();

      /**
       * Permanently delete column
       */
      await delCol.deleteOne();

      return {
        message:
          'Column deleted successfully.',
        success: true,
        data: updatedBoard,
      };
    } catch (err) {
      return {
        message:
          "Something isn't right !",
        success: false,
      };
    }
  }
}