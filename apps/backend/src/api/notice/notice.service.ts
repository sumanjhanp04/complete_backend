import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Notice,
  NoticeDocument,
} from '../../../../../libs/database/src/schemas/notices/notice.schema';

import { FileUploadService } from '../../../../../libs/file-upload/src/file-upload.service';

import { ListQueryDTO } from '@lib/dto';
import { UpdateNoticeDto } from '@lib/dto/dtos/notice/notice.dto';

/**
 * ============================================================================
 * Notice Service
 * ============================================================================
 *
 * Purpose:
 * Handles all business logic related to notices.
 *
 * Responsibilities:
 * - Create Notice
 * - List Notices
 * - Find Notice By Id
 * - Update Notice
 * - Delete Notice
 * - Delete Files From AWS S3
 *
 * Architecture:
 *
 * NoticeController
 *        │
 *        ▼
 * NoticeService
 *        │
 *        ├── MongoDB (Notice Collection)
 *        └── AWS S3 (File Storage)
 *
 * ============================================================================
 */

@Injectable()
export class NoticeService {
  constructor(
    /**
     * ------------------------------------------------------------------------
     * File Upload Service
     * ------------------------------------------------------------------------
     *
     * Used for:
     * - Delete files from AWS S3
     * - Verify uploaded files
     * - Upload operations
     *
     * ------------------------------------------------------------------------
     */
    private readonly fileUploadService: FileUploadService,

    /**
     * ------------------------------------------------------------------------
     * Notice Model
     * ------------------------------------------------------------------------
     *
     * MongoDB Collection:
     * notices
     *
     * ------------------------------------------------------------------------
     */
    @InjectModel(Notice.name)
    private readonly noticeModel: Model<NoticeDocument>,
  ) { }

  /**
   * ==========================================================================
   * Create Notice
   * ==========================================================================
   *
   * Creates a new notice record after file upload
   * has been completed successfully.
   *
   * Flow:
   *
   * Redis Metadata
   *      ↓
   * Create Notice Object
   *      ↓
   * Save To MongoDB
   *      ↓
   * Return Created Notice
   *
   * ==========================================================================
   */
  async createNotice(data: any): Promise<Notice> {
    const newNotice = new this.noticeModel({
      title: data.createNoticeDto.title,
      filename: data.filename,
      description: data.createNoticeDto.description,
      shift: data.createNoticeDto.shift,
      department: data.createNoticeDto.department,
      employeeId: data.createNoticeDto.employeeId,
      expiryDate: data.createNoticeDto.expiryDate,
      filePath: data.path,
    });

    /**
     * Save notice in MongoDB
     */
    const savedNotice = await newNotice.save();

    return savedNotice;
  }

  /**
   * ==========================================================================
   * Get All Notices
   * ==========================================================================
   *
   * Supports:
   * - Role Based Access
   * - Department Filtering
   * - Shift Filtering
   * - Employee Filtering
   * - Keyword Search
   * - Pagination
   * - Sorting
   *
   * ==========================================================================
   */
  async findAll(
    user: any,
    searchType: {
      department?: string[];
      shift?: string[];
      employeeId?: string[];
    },
    {
      page = 1,
      limit = 10,
      sort,
      sortBy,
      keyword,
    }: ListQueryDTO,
  ) {
    let query: any = {};

    /**
     * ------------------------------------------------------------------------
     * Admin / HR / Manager Access
     * ------------------------------------------------------------------------
     *
     * These users can view all notices.
     * Optional filters can be applied.
     *
     * ------------------------------------------------------------------------
     */
    if (
      ['Admin', 'Hr'].includes(user.userId.role) ||
      user.isManager
    ) {
      /**
       * Filter By Department
       */
      if (searchType.department?.length) {
        query.department = {
          $in: searchType.department,
        };
      }

      /**
       * Filter By Shift
       */
      if (searchType.shift?.length) {
        query.shift = {
          $in: searchType.shift,
        };
      }

      /**
       * Filter By Employee
       */
      if (searchType.employeeId?.length) {
        query.employeeId = {
          $in: searchType.employeeId,
        };
      }
    } else {
      /**
       * ----------------------------------------------------------------------
       * Employee Access
       * ----------------------------------------------------------------------
       *
       * Employees can only see:
       * - Public notices
       * - Department notices
       * - Shift notices
       * - Personal notices
       *
       * ----------------------------------------------------------------------
       */

      const orConditions = [];

      /**
       * Public Notices
       *
       * Visible to everyone.
       */
      orConditions.push({
        $and: [
          {
            $or: [
              { department: [] },
              { department: null },
            ],
          },
          {
            $or: [
              { shift: [] },
              { shift: null },
            ],
          },
          {
            $or: [
              { employeeId: [] },
              { employeeId: null },
            ],
          },
        ],
      });

      /**
       * Department Specific Notice
       */
      if (user.userId?.designation?.department) {
        orConditions.push({
          department: {
            $in: [
              user.userId.designation.department,
            ],
          },
        });
      }

      /**
       * Shift Specific Notice
       */
      if (user?.shift) {
        orConditions.push({
          shift: {
            $in: [user.shift],
          },
        });
      }

      /**
       * Employee Specific Notice
       */
      if (user.userId?._id) {
        orConditions.push({
          employeeId: {
            $in: [user.userId._id],
          },
        });
      }

      /**
       * Build Query Conditions
       */
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    /**
     * ------------------------------------------------------------------------
     * Keyword Search
     * ------------------------------------------------------------------------
     *
     * Search By Title
     *
     * Example:
     * ?keyword=holiday
     *
     * ------------------------------------------------------------------------
     */
    if (keyword) {
      query = {
        ...query,
        title: {
          $regex: keyword,
          $options: 'i',
        },
      };
    }

    /**
     * ------------------------------------------------------------------------
     * Fetch Notice Records
     * ------------------------------------------------------------------------
     */
    const data = await this.noticeModel
      .find(query)

      /**
       * Populate Relations
       */
      .populate('department')
      .populate('shift')
      .populate('employeeId')

      /**
       * Sorting
       */
      .sort({
        [sortBy]: sort === 'asc' ? 1 : -1,
      })

      /**
       * Pagination
       */
      .skip((page - 1) * limit)
      .limit(limit)

      .exec();

    /**
     * Total Records Count
     */
    const total = await this.noticeModel
      .countDocuments(query)
      .exec();

    return {
      data,
      pagination: {
        total,
        count: data.length,
      },
    };
  }

  /**
   * ==========================================================================
   * Find Notice By Id
   * ==========================================================================
   *
   * Used By:
   * - Update Notice
   * - Delete Notice
   * - Notice Details
   *
   * ==========================================================================
   */
  async findById(
    noticeId: string,
  ): Promise<NoticeDocument | null> {
    return this.noticeModel
      .findById(noticeId)
      .exec();
  }

  /**
   * ==========================================================================
   * Update Notice
   * ==========================================================================
   *
   * Updates an existing notice.
   *
   * ==========================================================================
   */
  async updateNotice(
    noticeId: string,
    updateNoticeDto: UpdateNoticeDto,
  ): Promise<Notice> {
    const updatedNotice = await this.noticeModel
      .findByIdAndUpdate(
        noticeId,
        updateNoticeDto,
        {
          new: true,
        },
      )
      .populate('department')
      .populate('shift')
      .populate('employeeId')
      .exec();

    if (!updatedNotice) {
      throw new NotFoundException(
        'Notice not found',
      );
    }

    return updatedNotice;
  }

  /**
   * ==========================================================================
   * Delete Notice
   * ==========================================================================
   *
   * Steps:
   * 1. Delete file from AWS S3
   * 2. Delete notice from MongoDB
   *
   * ==========================================================================
   */
  async deleteNotice(
    noticeId: string,
    filePath: string,
  ): Promise<void> {
    /**
     * Delete File From AWS S3
     */
    await this.fileUploadService.deleteFile(
      filePath,
    );

    /**
     * Delete Notice Record
     */
    const result = await this.noticeModel
      .findByIdAndDelete(noticeId)
      .exec();

    if (!result) {
      throw new NotFoundException(
        'Notice not found',
      );
    }
  }
}