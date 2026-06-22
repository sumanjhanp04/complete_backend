import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// DTOs
import {
  CreateProjectHistoryDto,
  UpdateProjectHistoryDto,
} from '@lib/dto';

// Database Schema
import { TasksHistory } from '@lib/database';

/**
 * TaskHistoryService
 *
 * Handles:
 * - Create Task History
 * - List Task Histories
 * - Get Single History
 * - Update History
 * - Delete History
 *
 * Purpose:
 * Maintain task activity logs.
 *
 * Example:
 *
 * Task: Login API
 *
 * History:
 * - Task Created
 * - Assigned To Suman
 * - Status Changed
 * - Moved Todo → In Progress
 * - Moved In Progress → Done
 */
@Injectable()
export class TaskHistoryService {
  constructor(
    /**
     * Inject TasksHistory Collection
     */
    @InjectModel(TasksHistory.name)
    private readonly projectsHistoryModel: Model<TasksHistory>,
  ) { }

  // ============================================================
  // CREATE TASK HISTORY
  // ============================================================

  /**
   * Creates a new task history record.
   *
   * Example:
   *
   * {
   *   taskId: "task123",
   *   createdBy: "user123",
   *   message: "Task assigned to Suman"
   * }
   */
  async createHistory(
    createProjectHistoryDto: CreateProjectHistoryDto,
  ) {
    try {
      /**
       * Create history document
       */
      const newHistory =
        new this.projectsHistoryModel(
          createProjectHistoryDto,
        );

      /**
       * Save to MongoDB
       */
      const data = await newHistory.save();

      return {
        message:
          'History created successfully.',
        success: true,
        data,
      };
    } catch (err) {
      return {
        message: "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  // ============================================================
  // LIST ALL TASK HISTORIES
  // ============================================================

  /**
   * Returns all task history records.
   *
   * Example:
   *
   * [
   *   "Task Created",
   *   "Assigned To User",
   *   "Moved To Done"
   * ]
   */
  async listAllHistories() {
    try {
      const data =
        await this.projectsHistoryModel
          .find()
          .exec();

      return {
        message: 'All histories listed.',
        success: true,
        data,
      };
    } catch (err) {
      return {
        message: "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  // ============================================================
  // GET SINGLE HISTORY
  // ============================================================

  /**
   * Returns a single history record.
   */
  async getHistoryById(id: string) {
    try {
      const history =
        await this.projectsHistoryModel
          .findById(id)
          .exec();

      /**
       * History not found
       */
      if (!history) {
        throw new NotFoundException(
          `History with ID ${id} not found.`,
        );
      }

      return {
        message:
          'History retrieved successfully.',
        success: true,
        data: history,
      };
    } catch (err) {
      return {
        message:
          err.message ||
          "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  // ============================================================
  // UPDATE TASK HISTORY
  // ============================================================

  /**
   * Updates a task history record.
   *
   * Example:
   *
   * Before:
   * "Assigned To User"
   *
   * After:
   * "Assigned To Suman"
   */
  async updateHistory(
    id: string,
    updateProjectHistoryDto: UpdateProjectHistoryDto,
  ) {
    try {
      const updatedHistory =
        await this.projectsHistoryModel
          .findByIdAndUpdate(
            id,
            updateProjectHistoryDto,
            {
              new: true,
            },
          )
          .exec();

      /**
       * History not found
       */
      if (!updatedHistory) {
        throw new NotFoundException(
          `History with ID ${id} not found.`,
        );
      }

      return {
        message:
          'History updated successfully.',
        success: true,
        data: updatedHistory,
      };
    } catch (err) {
      return {
        message:
          err.message ||
          "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  // ============================================================
  // DELETE TASK HISTORY
  // ============================================================

  /**
   * Deletes a history record.
   */
  async deleteHistory(id: string) {
    try {
      const result =
        await this.projectsHistoryModel
          .findByIdAndDelete(id)
          .exec();

      /**
       * History not found
       */
      if (!result) {
        throw new NotFoundException(
          `History with ID ${id} not found.`,
        );
      }

      return {
        message:
          'History deleted successfully.',
        success: true,
      };
    } catch (err) {
      return {
        message:
          err.message ||
          "Something isn't right!",
        success: false,
        err,
      };
    }
  }
}