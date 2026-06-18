import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCommentDto, UpdateCommentDto } from '@lib/dto'; // Adjust the path accordingly
import { Comments } from '@lib/database';
import { USER_POPULATION_FIELDS } from '@lib/common';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comments.name) private readonly commentsModel: Model<Comments>,
  ) {}

  async createComment(createCommentDto: CreateCommentDto) {
    const data = await (
      await this.commentsModel.create(createCommentDto)
    ).populate({
      path: 'createdBy',
      select: 'userId userIdRef',
      populate: {
        path: 'userId',
        select: 'firstName lastName image',
      },
    });
    return data;
  }

  async listAllComments(taskId: string) {
    const data = await this.commentsModel
      .find({ taskId: taskId })
      .populate({
        path: 'createdBy',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: USER_POPULATION_FIELDS,
        },
      })
      .exec();
    return data;
  }

  async getCommentById(id: string) {
    const comment = await this.commentsModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }
    return comment;

  }

  async updateComment(id: string, updateCommentDto: UpdateCommentDto) {
    const updatedComment = await this.commentsModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }
    return updatedComment;
  }



  async deleteComment(id: string, user: string) {

    const result = await this.commentsModel.findOneAndDelete({ _id: id, createdBy: user }).exec();
    if (!result) {
      throw new NotFoundException(`Comment not found.`);
    }
    return result;
  }
}
