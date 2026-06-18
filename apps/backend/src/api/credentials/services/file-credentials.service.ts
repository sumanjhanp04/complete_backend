// import { FileUploadService } from '@app/file-upload';
import { FileUploadService } from '@app/file-upload';
import { AUTH_SERVICE, USERS_API_MAPS } from '@lib/common';
import {
  FileCredentialDocument,
  FileCredential,
} from '@lib/database/schemas/credentials/file-credentials.schema';
import { ListQueryDTO } from '@lib/dto';

import { UpdateFileCredentialDto } from '@lib/dto/dtos/credentials/update-file-credentials.dto';
// import { UpdateFileCredentialDto } from '@lib/dto/dtos/credentials/update-file-credentials.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { RedisService } from 'libs/cache/src';
import { Model } from 'mongoose';
@Injectable()
export class FileCredentialsService {
  constructor(
    @InjectModel(FileCredential.name)
    private fileCredentialModel: Model<FileCredentialDocument>,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly redisService: RedisService,
    private readonly fileService: FileUploadService,
  ) { }

  async create(createDto: any, filePath: string, userId: string): Promise<any> {
    try {
      let filename = createDto.filename;
      const extension = filename.includes('.') ? filename.split('.').pop() : '';
      const baseName = extension
        ? filename.replace(`.${extension}`, '')
        : filename;
      const f = await this.fileCredentialModel.find({
        filename: createDto.filename,
      });

      if (f.length > 0) {
        // Fetch only non-deleted files with similar names
        const existingFiles = await this.fileCredentialModel.find({
          filename: new RegExp(
            `^${baseName}(\\(\\d+\\))?\\.${extension}$`,
            'i',
          ),
          isDeleted: { $ne: true }, // Ignore deleted files
        });

        if (existingFiles.length > 0) {
          // Extract numbers from existing filenames
          const numbers = existingFiles
            .map((file) => {
              const match = file.filename.match(/\((\d+)\)\.${extension}$/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((num) => num > 0)
            .sort((a, b) => a - b);

          let nextNumber = 1;
          if (numbers.length > 0) {
            nextNumber = numbers[numbers.length - 1] + 1;
          }

          do {
            filename = `${baseName}(${nextNumber}).${extension}`;
            nextNumber++;
          } while (existingFiles.some((file) => file.filename === filename));
        }
      }

      // Create new file entry in the database
      const newFile = await this.fileCredentialModel.create({
        filename,
        size: createDto.size,
        path: filePath,
        sharedWith: createDto.sharedWith,
        createdBy: userId,
        isDeleted: false, // Ensure new files are marked as active
      });

      // Update storage allocation before saving file
      await this.updateAllocatedSize(userId, createDto.size, 'decrement');


      return newFile;
    } catch (error) {
      console.error('Error saving file:', error.message);
      throw new Error('Failed to save file to the database.');
    }
  }

  async findAllFiles(
    userId: string,
    searchType: string,
    { page = 1, limit = 10, sort, sortBy, keyword }: ListQueryDTO, // Destructure query params from DTO
  ) {
    // const cacheKey = `files:${userId}:${searchType}:${page}:${limit}:${sort}:${sortBy}:${keyword}`;
    // const cachedFilesData = await this.redisService.getFromCache(cacheKey);

    // if (typeof cachedFilesData === 'string' && cachedFilesData) {
    //   return JSON.parse(cachedFilesData);
    // }

    const perPage = limit;
    let query = {};

    // Define query based on search type
    switch (searchType) {
      case 'createdByMe':
        query = { createdBy: userId };
        break;
      case 'sharedWithMe':
        query = { 'sharedWith.userId': userId };
        break;
      case 'all':
      default:
        query = {
          $or: [{ createdBy: userId }, { 'sharedWith.userId': userId }],
        };
        break;
    }

    // Apply keyword search if provided
    if (keyword) {
      query = { ...query, name: { $regex: keyword, $options: 'i' } }; // Example for name field
    }

    // Fetch file credentials with pagination and optional sorting
    let fileCredentialsQuery = this.fileCredentialModel.find(query).populate([
      {
        path: 'createdBy',
        select: '-password',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
      {
        path: 'sharedWith.userId',
        select: '-password',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
    ]);

    // Apply sorting if sort and sortBy are provided
    if (sort && sortBy) {
      fileCredentialsQuery = fileCredentialsQuery.sort({
        [sortBy]: sort === 'asc' ? 1 : -1,
      });
    }

    const total = await this.fileCredentialModel.countDocuments(query);
    const files = await fileCredentialsQuery
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    const result = {
      data: files,
      pagination: {
        total,
        count: files.length,
      },
    };

    return result;
  }

  async findAllSharedWithUser(userId: string) {
    return this.fileCredentialModel
      .find({ 'sharedWith.userId': userId })
      .exec();
  }

  async findOne(userId: string, id: string) {
    return this.fileCredentialModel
      .findOne({
        _id: id,
        $or: [{ 'sharedWith.userId': userId }, { createdBy: userId }],
      })
      .exec();
  }

  async findOneCreatedBy(userId: string, id: string) {
    const a = await this.fileCredentialModel.findOne({ _id: id }).exec();
    return a;
  }

  async updateFile(
    fileId: string,
    path: string,
    filename: string,
    size: number,
  ): Promise<FileCredential> {
    return await this.fileCredentialModel.findByIdAndUpdate(
      fileId,
      { path, filename, size },
      { new: true },
    );
  }
  async update(fileId: string, updateData: UpdateFileCredentialDto) {
    const a = await this.fileCredentialModel.updateOne(
      { _id: fileId },
      { $set: { sharedWith: updateData.sharedWith } }, // Correct way
    );
    return a;
  }
  async findFilesSharedWithUser(userId: string): Promise<FileCredential[]> {
    return this.fileCredentialModel
      .find({
        'sharedWith.userId': userId,
      })
      .exec();
  }

  async findById(fileId: string) {
    return await this.fileCredentialModel.findById(fileId);
  }

  async remove(fileId: string): Promise<any> {
    const result = await this.fileCredentialModel
      .findByIdAndDelete(fileId)
      .exec();


    if (!result) throw new NotFoundException('File not found');
    // if(result.createdBy!==id){
    //   throw new ForbiddenException(
    //     "Access denied. Not Created By you or doesn't exist.",
    //   );
    // }
    // Then update storage allocation
    await this.updateAllocatedSize(
      result.createdBy.toString(),
      result.size,
      'increment',
    );
    return result;
  }

  async updateAllocatedSize(
    userId: string,
    fileSize: number,
    operation: 'increment' | 'decrement' = 'decrement',
    remainingStorage?: number,
  ) {
    try {
      const userRecord = await this.authClient
        .send({ cmd: USERS_API_MAPS.GET_USER }, { id: userId })
        .toPromise();
      if (!userRecord) {
        throw new NotFoundException('User not found');
      }

      let remainingSpace = remainingStorage
        ? remainingStorage
        : userRecord.allocatedSpace;



      // For upload (decrement available space)
      if (operation === 'decrement') {
        if (remainingSpace < fileSize) {
          throw new BadRequestException(
            'Insufficient storage space. Please free up some space or contact support for more storage.',
          );
        }
        remainingSpace -= fileSize;
      }
      // For deletion (increment available space)
      else {
        remainingSpace += fileSize;
      }



      // Update user's storage allocation
      const response = await this.authClient
        .send(
          { cmd: USERS_API_MAPS.UPDATE_SIZEOF_FILE_ALLOCATED },
          {
            id: userId,
            size: remainingSpace,
          },
        )
        .toPromise();

      if (!response) {
        throw new Error('Failed to update storage allocation');
      }


      return response;
    } catch (error) {
      console.error('Error updating storage allocation:', error);
      throw error;
    }
  }

  async fetchUser(id: string): Promise<any> {
    const userRecord = await this.authClient
      .send(
        { cmd: USERS_API_MAPS.GET_USER },
        {
          id: id,
        },
      )
      .toPromise();
    if (!userRecord) {
      throw new NotFoundException('User not found');
    }
    return userRecord;
  }

  // TODO: remove the method
  // async deleteAllFiles() {
  //   // Get all files first if you need to delete from S3
  //   const files = await this.fileCredentialModel.find().exec();

  //   // Delete from S3 if using S3
  //   if (files.length > 0) {
  //     await Promise.all(
  //       files.map((file) =>
  //         this.fileService
  //           .deleteFile(file.path)
  //           .catch((err) =>
  //             console.error(`Failed to delete file ${file.path} from S3:`, err),
  //           ),
  //       ),
  //     );
  //   }

  //   // Delete all records from database
  //   return this.fileCredentialModel.deleteMany({});
  // }
}
