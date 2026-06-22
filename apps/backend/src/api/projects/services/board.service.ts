import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

// DTOs for board creation and update
import { CreateBoardDto, UpdateBoardDto } from '@lib/dto';

// Service used to manage board columns
import { ColumnsService } from './column.service';

// Database Models
import { Boards, Projects, TasksHistory } from '@lib/database';

/**
 * Boards Service
 *
 * Handles:
 * - Board Creation
 * - Board Listing
 * - Board Details
 * - Board Update
 * - Board Deletion
 *
 * Relationship Structure:
 *
 * Project
 *   └── Board
 *         └── Columns
 *               └── Tasks
 */
@Injectable()
export class BoardsService {
  /**
   * Logger instance for debugging
   */
  private logger = new Logger(BoardsService.name);

  constructor(
    /**
     * MongoDB Board Model
     */
    @InjectModel(Boards.name)
    private readonly boardsModel: Model<Boards>,

    /**
     * MongoDB Project Model
     */
    @InjectModel(Projects.name)
    private readonly projectsModel: Model<Projects>,

    /**
     * Column Service
     * Used while deleting board columns
     */
    private readonly columnService: ColumnsService,
  ) { }

  // ============================================================
  // CREATE BOARD
  // ============================================================

  /**
   * Creates a new board.
   *
   * Example:
   * {
   *   name: "Development Board",
   *   project: "projectId",
   *   admin: "userId"
   * }
   */
  async createBoard(createBoardDto: CreateBoardDto) {
    // Create board document
    const newBoard = new this.boardsModel(createBoardDto);

    // Save into MongoDB
    const d = await newBoard.save();

    return d;
  }

  // ============================================================
  // GET ALL BOARDS OF A PROJECT
  // ============================================================

  /**
   * Returns all boards under a project.
   *
   * Populates:
   * - Admin
   * - Assigned Users
   * - Columns
   * - Tasks
   * - Task Users
   */
  async listAllBoards(project: string) {
    const data = await this.boardsModel
      .find({
        project: project,
      })

      /**
       * Populate Board Admin
       */
      .populate({
        path: 'admin',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
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
          select: 'firstName lastName image gender',
        },
      })

      /**
       * Populate Columns -> Tasks -> Users
       */
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

    return data;
  }

  // ============================================================
  // GET BOARDS ASSIGNED TO CURRENT USER
  // ============================================================

  /**
   * Returns boards where user is:
   * - Board Admin
   * OR
   * - Assigned User
   */
  async listMyBoards(project: string, user: string) {
    const filter = {
      project: project,

      $or: [
        {
          admin: new mongoose.Types.ObjectId(user),
        },
        {
          assignedUser: {
            $in: [new mongoose.Types.ObjectId(user)],
          },
        },
      ],
    };

    // Log generated filter
    this.logger.log(filter);

    const data = await this.boardsModel
      .find(filter)

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

    return data;
  }

  // ============================================================
  // GET SINGLE BOARD
  // ============================================================

  /**
   * Returns board details by board ID.
   *
   * Also returns:
   * - Project Name
   * - Admin
   * - Assigned Users
   * - Columns
   * - Tasks
   */
  async getBoardById(id: string) {
    const data = await this.boardsModel
      .findById(id)

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

      /**
       * Populate Project Information
       */
      .populate({
        path: 'project',
        select: 'name',
      })

      .exec();

    // Throw exception if board not found
    if (!data) {
      throw new NotFoundException('Board not found');
    }

    return data;
  }

  // ============================================================
  // UPDATE BOARD
  // ============================================================

  /**
   * Updates board information.
   *
   * Example:
   * {
   *   name: "Updated Board"
   * }
   */
  async updateBoard(
    id: string,
    updateBoardDto: UpdateBoardDto,
  ) {
    // Log incoming update payload
    this.logger.log(updateBoardDto);

    const updatedBoard = await this.boardsModel
      .findByIdAndUpdate(
        id,
        updateBoardDto,
        {
          new: true, // Return updated document
        },
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

    // Board not found
    if (!updatedBoard) {
      throw new NotFoundException('Board Not Found');
    }

    // Log updated document
    this.logger.log(updatedBoard);

    return updatedBoard;
  }

  // ============================================================
  // DELETE BOARD
  // ============================================================

  /**
   * Deletes a board and all its columns.
   *
   * Steps:
   * 1. Find Board
   * 2. Delete Columns
   * 3. Delete Board
   * 4. Remove Board from Project
   */
  async deleteBoard(
    id: string,
    project: string,
  ) {
    /**
     * Fetch Board
     */
    const board: any =
      await this.boardsModel.findById(id);

    /**
     * Delete all columns belonging to board
     */
    for (let i = 0; i < board.columns.length; i++) {
      const d =
        await this.columnService.deleteColumn(
          board.columns[i]?._id,
          id,
        );

      if (!d?.success) {
        return d;
      }
    }

    /**
     * Delete Board
     */
    const result =
      await this.boardsModel
        .findByIdAndDelete(id)
        .exec();

    if (!result) {
      throw new NotFoundException(
        'Board not found',
      );
    }

    /**
     * Remove board reference from project
     *
     * Before:
     * boards = [b1,b2,b3]
     *
     * Delete:
     * b2
     *
     * After:
     * boards = [b1,b3]
     */
    await this.projectsModel.findByIdAndUpdate(
      project,
      {
        $pull: {
          boards: id,
        },
      },
    );

    return result;
  }
}