import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// DTOs
import {
  CreateProjectHistoryDto,
  UpdateProjectHistoryDto,
} from '@lib/dto';

// Database Schema
import { ProjectsHistory } from '@lib/database';

/**
 * ProjectsHistoryService
 *
 * Handles:
 * - Create Project History
 * - List Project Histories
 * - Get Single History
 * - Update History
 * - Delete History
 *
 * Purpose:
 * Maintain an audit trail of project activities.
 *
 * Example:
 *
 * Project:
 * CRM Development
 *
 * History:
 * - Project Created
 * - Task Added
 * - Task Assigned
 * - Status Changed
 * - Deadline Updated
 */
@Injectable()
export class ProjectsHistoryService {
  constructor(
    /**
     * Inject Project History Model
     */
    @InjectModel(ProjectsHistory.name)
    private readonly projectsHistoryModel: Model<ProjectsHistory>,
  ) { }

  // ============================================================
  // CREATE PROJECT HISTORY
  // ============================================================

  /**
   * Creates a new history record.
   *
   * Example:
   *
   * {
   *   project: "projectId",
   *   message: "Task assigned to John",
   *   createdBy: "userId"
   * }
   */
  async createHistory(
    createProjectHistoryDto: CreateProjectHistoryDto,
  ): Promise<{
    message: string;
    success: boolean;
    data?: ProjectsHistory;
    err?: any;
  }> {
    try {
      /**
       * Create new history document
       */
      const newHistory =
        new this.projectsHistoryModel(
          createProjectHistoryDto,
        );

      /**
       * Save into MongoDB
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
  // LIST ALL HISTORIES
  // ============================================================

  /**
   * Returns all project history records.
   *
   * Example:
   *
   * [
   *   {
   *     message: "Project Created"
   *   },
   *   {
   *     message: "Task Assigned"
   *   }
   * ]
   */
  async listAllHistories(): Promise<{
    message: string;
    success: boolean;
    data?: ProjectsHistory[];
    err?: any;
  }> {
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
  // GET HISTORY BY ID
  // ============================================================

  /**
   * Returns a single history record.
   *
   * Example:
   *
   * History ID
   *      ↓
   * Find Record
   *      ↓
   * Return History
   */
  async getHistoryById(
    id: string,
  ): Promise<{
    message: string;
    success: boolean;
    data?: ProjectsHistory;
    err?: any;
  }> {
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
  // UPDATE HISTORY
  // ============================================================

  /**
   * Updates an existing history record.
   *
   * Example:
   *
   * Before:
   * "Task Assigned"
   *
   * After:
   * "Task Assigned to Suman"
   */
  async updateHistory(
    id: string,
    updateProjectHistoryDto: UpdateProjectHistoryDto,
  ): Promise<{
    message: string;
    success: boolean;
    data?: ProjectsHistory;
    err?: any;
  }> {
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
  // DELETE HISTORY
  // ============================================================

  /**
   * Deletes a history record.
   *
   * Example:
   *
   * History ID
   *      ↓
   * Delete Record
   *      ↓
   * Return Success
   */
  async deleteHistory(
    id: string,
  ): Promise<{
    message: string;
    success: boolean;
    err?: any;
  }> {
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