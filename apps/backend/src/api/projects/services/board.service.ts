import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateBoardDto, UpdateBoardDto } from '@lib/dto';
import { ColumnsService } from './column.service';
import { Boards, Projects, TasksHistory } from '@lib/database';

@Injectable()
export class BoardsService {
  private logger = new Logger(BoardsService.name);
  constructor(
    @InjectModel(Boards.name) private readonly boardsModel: Model<Boards>,
    @InjectModel(Projects.name) private readonly projectsModel: Model<Projects>,
    private readonly columnService: ColumnsService,
  ) { }

  // CREATE Board
  async createBoard(createBoardDto: CreateBoardDto) {
    const newBoard = new this.boardsModel(createBoardDto);
    const d = await newBoard.save();
    return d;
  }

  // READ (List) all Boards
  async listAllBoards(project: string) {
    const data = await this.boardsModel
      .find({ project: project })
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

  async listMyBoards(project: string, user: string) {

    const filter = {
      project: project,
      $or: [{ admin: new mongoose.Types.ObjectId(user) }, { assignedUser: { $in: [new mongoose.Types.ObjectId(user)] } }],
    };
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

  // READ (Get) a single Board
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
      }).populate({
        path: 'project',
        select: 'name',
      })
      .exec();
    if (!data) {
      throw new NotFoundException('Board not found');
    }

    return data;
  }

  // UPDATE Board
  async updateBoard(id: string, updateBoardDto: UpdateBoardDto) {
    this.logger.log(updateBoardDto)
    
    const updatedBoard = await this.boardsModel
    .findByIdAndUpdate(id, updateBoardDto, { new: true })
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
    if (!updatedBoard) {
      throw new NotFoundException('Board Not Found');
    }

    this.logger.log(updatedBoard);

    return updatedBoard;
  }

  // DELETE Board
  async deleteBoard(id: string, project: string) {
    const board: any = await this.boardsModel.findById(id);
    for (let i = 0; i < board.columns.length; i++) {
      const d = await this.columnService.deleteColumn(
        board.columns[i]?._id,
        id,
      );
      if (!d?.success) return d;
    }
    const result = await this.boardsModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Board not found');
    }
    const updatedProject = await this.projectsModel.findByIdAndUpdate(project, {
      $pull: { boards: id },
    });
    return result;
  }
}
