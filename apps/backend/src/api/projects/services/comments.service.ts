import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// DTOs
import {
  CreateCommentDto,
  UpdateCommentDto,
} from '@lib/dto';

// Database Schema
import { Comments } from '@lib/database';

// Common Constants
import { USER_POPULATION_FIELDS } from '@lib/common';

/**
 * CommentsService
 *
 * Handles:
 * - Create Comment
 * - Get All Comments
 * - Get Single Comment
 * - Update Comment
 * - Delete Comment
 *
 * Relationship:
 *
 * Task
 *   │
 *   ├── Comment 1
 *   ├── Comment 2
 *   ├── Comment 3
 *   └── Comment N
 *
 */
@Injectable()
export class CommentsService {
  constructor(
    /**
     * Inject MongoDB Comments Model
     */
    @InjectModel(Comments.name)
    private readonly commentsModel: Model<Comments>,
  ) { }

  // ============================================================
  // CREATE COMMENT
  // ============================================================

  /**
   * Creates a new comment.
   *
   * Example:
   *
   * {
   *   taskId: "task123",
   *   comment: "Task is completed",
   *   createdBy: "user123"
   * }
   *
   * Flow:
   * Request
   *    ↓
   * Create Comment
   *    ↓
   * Populate User Details
   *    ↓
   * Return Comment
   */
  async createComment(
    createCommentDto: CreateCommentDto,
  ) {
    const data = await (
      await this.commentsModel.create(
        createCommentDto,
      )
    ).populate({
      /**
       * Populate creator details
       */
      path: 'createdBy',

      select: 'userId userIdRef',

      populate: {
        path: 'userId',

        select:
          'firstName lastName image',
      },
    });

    return data;
  }

  // ============================================================
  // GET ALL COMMENTS OF A TASK
  // ============================================================

  /**
   * Returns all comments
   * belonging to a task.
   *
   * Example:
   *
   * Task:
   * Create Login API
   *
   * Comments:
   * - Started Working
   * - API Completed
   * - Ready For Testing
   */
  async listAllComments(
    taskId: string,
  ) {
    const data =
      await this.commentsModel

        .find({
          taskId: taskId,
        })

        /**
         * Populate User Information
         */
        .populate({
          path: 'createdBy',

          select: 'userId userIdRef',

          populate: {
            path: 'userId',

            select:
              USER_POPULATION_FIELDS,
          },
        })

        .exec();

    return data;
  }

  // ============================================================
  // GET COMMENT BY ID
  // ============================================================

  /**
   * Returns a single comment.
   *
   * Example:
   *
   * Comment ID
   *      ↓
   * Find Comment
   *      ↓
   * Return Comment
   */
  async getCommentById(id: string) {
    const comment =
      await this.commentsModel
        .findById(id)
        .exec();

    /**
     * Comment not found
     */
    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${id} not found.`,
      );
    }

    return comment;
  }

  // ============================================================
  // UPDATE COMMENT
  // ============================================================

  /**
   * Updates an existing comment.
   *
   * Example:
   *
   * Before:
   * "Task completed"
   *
   * After:
   * "Task completed successfully"
   */
  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    const updatedComment =
      await this.commentsModel
        .findByIdAndUpdate(
          id,
          updateCommentDto,
          {
            new: true, // Return updated document
          },
        )
        .exec();

    /**
     * Comment not found
     */
    if (!updatedComment) {
      throw new NotFoundException(
        `Comment with ID ${id} not found.`,
      );
    }

    return updatedComment;
  }

  // ============================================================
  // DELETE COMMENT
  // ============================================================

  /**
   * Deletes a comment.
   *
   * Security Rule:
   * Only the creator of the comment
   * can delete it.
   *
   * Query:
   *
   * {
   *   _id: commentId,
   *   createdBy: userId
   * }
   */
  async deleteComment(
    id: string,
    user: string,
  ) {
    const result =
      await this.commentsModel
        .findOneAndDelete({
          _id: id,
          createdBy: user,
        })
        .exec();

    /**
     * Comment not found
     * OR
     * User is not owner
     */
    if (!result) {
      throw new NotFoundException(
        `Comment not found.`,
      );
    }

    return result;
  }
}