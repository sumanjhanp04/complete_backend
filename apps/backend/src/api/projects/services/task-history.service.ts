import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectHistoryDto, UpdateProjectHistoryDto } from '@lib/dto'; // Update the path accordingly
import { TasksHistory } from '@lib/database';

@Injectable()
export class TaskHistoryService {
  constructor(
    @InjectModel(TasksHistory.name)
    private readonly projectsHistoryModel: Model<TasksHistory>,
  ) {}

  async createHistory(createProjectHistoryDto: CreateProjectHistoryDto) {
    try {
      const newHistory = new this.projectsHistoryModel(createProjectHistoryDto);
      const data = await newHistory.save();
      return { message: 'History created successfully.', success: true, data };
    } catch (err) {
      return { message: "Something isn't right!", success: false, err };
    }
  }

  async listAllHistories() {
    try {
      const data = await this.projectsHistoryModel.find().exec();
      return { message: 'All histories listed.', success: true, data };
    } catch (err) {
      return { message: "Something isn't right!", success: false, err };
    }
  }

  async getHistoryById(id: string) {
    try {
      const history = await this.projectsHistoryModel.findById(id).exec();
      if (!history) {
        throw new NotFoundException(`History with ID ${id} not found.`);
      }
      return {
        message: 'History retrieved successfully.',
        success: true,
        data: history,
      };
    } catch (err) {
      return {
        message: err.message || "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  async updateHistory(
    id: string,
    updateProjectHistoryDto: UpdateProjectHistoryDto,
  ) {
    try {
      const updatedHistory = await this.projectsHistoryModel
        .findByIdAndUpdate(id, updateProjectHistoryDto, { new: true })
        .exec();
      if (!updatedHistory) {
        throw new NotFoundException(`History with ID ${id} not found.`);
      }
      return {
        message: 'History updated successfully.',
        success: true,
        data: updatedHistory,
      };
    } catch (err) {
      return {
        message: err.message || "Something isn't right!",
        success: false,
        err,
      };
    }
  }

  async deleteHistory(id: string) {
    try {
      const result = await this.projectsHistoryModel
        .findByIdAndDelete(id)
        .exec();
      if (!result) {
        throw new NotFoundException(`History with ID ${id} not found.`);
      }
      return { message: 'History deleted successfully.', success: true };
    } catch (err) {
      return {
        message: err.message || "Something isn't right!",
        success: false,
        err,
      };
    }
  }
}
