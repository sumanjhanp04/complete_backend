import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notice,
  NoticeDocument,
} from '../../../../../libs/database/src/schemas/notices/notice.schema'; // Update the path to the schema
import { FileUploadService } from '../../../../../libs/file-upload/src/file-upload.service';
import { ListQueryDTO } from '@lib/dto';
import { UpdateNoticeDto } from '@lib/dto/dtos/notice/notice.dto';

@Injectable()
export class NoticeService {
  constructor(
    private readonly fileUploadService: FileUploadService,
    @InjectModel(Notice.name)
    private readonly noticeModel: Model<NoticeDocument>,
  ) { }

  async createNotice(data: any): Promise<Notice> {
    const newFile = new this.noticeModel({
      title: data.createNoticeDto.title,
      filename: data.filename,
      description: data.createNoticeDto.description,
      shift: data.createNoticeDto.shift,
      department: data.createNoticeDto.department,
      employeeId: data.createNoticeDto.employeeId,
      expiryDate: data.createNoticeDto.expiryDate,
      filePath: data.path,
    });

    const a = await newFile.save(); // Save the file to the database
    return a;
  }

  async findAll(
    user: any,
    searchType: {
      department?: string[];
      shift?: string[];
      employeeId?: string[];
    },
    { page = 1, limit = 10, sort, sortBy, keyword }: ListQueryDTO,
  ) {
    let query: any = {};
    // const user = await this.userService.getPopulatedUser(userId);

    // For admin, HR, or manager roles
    if (['Admin', 'Hr'].includes(user.userId.role) || user.isManager) {
      // Admin, HR, or Manager: Apply explicit filters if provided
      if (searchType.department?.length) {
        query.department = { $in: searchType.department };
      }
      if (searchType.shift?.length) {
        query.shift = { $in: searchType.shift };
      }
      if (searchType.employeeId?.length) {
        query.employeeId = { $in: searchType.employeeId };
      }
    } else {
      // For normal users, restrict access to notices based on their attributes
      const orConditions = [];

      // Notices available to all users
      orConditions.push({
        // When fields exist but are empty arrays or null
        $and: [
          { $or: [{ department: [] }, { department: null }] },
          { $or: [{ shift: [] }, { shift: null }] },
          { $or: [{ employeeId: [] }, { employeeId: null }] },
        ],
      });

      // Notices specific to the user's department
      if (user.userId?.designation?.department) {
        orConditions.push({
          department: { $in: [user.userId.designation.department] },
        });
      }

      // Notices specific to the user's shift
      if (user?.shift) {
        orConditions.push({ shift: { $in: [user.shift] } });
      }

      // Notices specific to the employee
      if (user.userId._id) {
        orConditions.push({ employeeId: { $in: [user.userId._id] } });
      }

      // Build OR conditions for the query
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    // Apply keyword search if provided
    if (keyword) {
      query = { ...query, title: { $regex: keyword, $options: 'i' } };
    }

    const data = await this.noticeModel
      .find(query)
      .populate('department')
      .populate('shift')
      .populate('employeeId')
      .sort({ [sortBy]: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.noticeModel.countDocuments(query).exec();

    return {
      data,
      pagination: {
        total,
        count: data.length,
      },
    };
  }

  async findById(fileId: string): Promise<NoticeDocument | null> {
    return this.noticeModel.findById(fileId).exec();
  }

  async updateNotice(
    noticeId: string,
    updateNoticeDto: UpdateNoticeDto,
  ): Promise<Notice> {
    const updatedFile = await this.noticeModel
      .findByIdAndUpdate(noticeId, updateNoticeDto, { new: true })
      .populate('department')
      .populate('shift')
      .populate('employeeId')
      .exec();

    if (!updatedFile) {
      throw new NotFoundException('File not found');
    }

    return updatedFile;
  }

  async deleteNotice(fileId: string, filePath: string): Promise<void> {
    // Remove the file from storage (e.g., S3)
    await this.fileUploadService.deleteFile(filePath);

    // Remove the file record from the database
    const result = await this.noticeModel.findByIdAndDelete(fileId).exec();

    if (!result) {
      throw new NotFoundException('File not found');
    }
  }
}
