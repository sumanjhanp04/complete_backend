import { getUserPopulationFields } from '@lib/common';
import { Employee, Teams, User } from '@lib/database';
import { Shift } from '@lib/database/schemas/employees/shift.schema';
import {
  CreateShiftDto,
  CreateTeamDto,
  ListQueryDTO,
  UpdateShiftDto,
  UpdateTeamDto,
} from '@lib/dto';
import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ShiftService {
  private logger = new Logger(ShiftService.name)
  constructor(
    @InjectModel(Shift.name) private readonly shiftModel: Model<Shift>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  async create(dto: CreateShiftDto) {
    const data = await this.shiftModel.create(dto);

    if (!data)
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);

    return data;
  }

  async findAll(query: ListQueryDTO) {
    const { keyword, page, limit, sort, sortBy } = query;

    let pipeline = []
    if (keyword) {

      pipeline.push({
        $match: {
          shiftName: {
            $regex: keyword,
            $options: 'i'
          }
        }
      })
    }

    pipeline.push({
      $lookup: {
        from: 'users',
        let: { shiftId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$shift', '$$shiftId'] },
                  { $eq: ['$status', true] }
                ]
              }
            }
          }
        ],
        as: 'employees'
      }
    },
      {
        $addFields: {
          employeeCount: { $size: '$employees' }
        }
      },
      {
        $project: {
          employees: 0
        }
      })




    if (sort && sortBy) {
      pipeline.push({ $sort: { [sortBy]: sort === 'asc' ? 1 : -1 } })
    }

    if (page && limit) {
      const totalCount = await this.shiftModel.aggregate(pipeline).count;
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip })
      pipeline.push({ $limit: limit })

      const paginatedResult = await this.shiftModel.aggregate(pipeline);

      return {
        data: paginatedResult,
        pagination: {
          total: totalCount,
          count: paginatedResult.length
        }
      };
    }

    return await this.shiftModel.aggregate(pipeline);


    // this.logger.log(pipeline)
    // const dd = await this.shiftModel.aggregate(pipeline);
    // this.logger.log(dd)


    // // Create a base query object
    // const qry: any = {};

    // // Add regex search on the `name` field if keyword is provided
    // if (keyword) {
    //   qry.shiftName = { $regex: keyword, $options: 'i' }; // 'i' for case-insensitive search
    // }

    // // Create a base query
    // let queryBuilder = this.shiftModel.find(qry);

    // // Apply sorting if provided
    // if (sort && sortBy) {
    //   queryBuilder = queryBuilder.sort({ [sortBy]: sort });
    // }

    // // Check if pagination parameters are provided
    // if (page && limit) {
    //   const skip = (page - 1) * limit;

    //   // Apply pagination
    //   const paginatedResult = await queryBuilder.skip(skip).limit(limit)
    //   const totalCount = await this.shiftModel.countDocuments(qry);

    //   // Return paginated result with metadata
    //   return {
    //     data: paginatedResult,
    //     pagination: {
    //       total: totalCount,
    //       count: paginatedResult.length
    //     }
    //   };
    // }

    // // If no pagination info is provided, return all the data
    // return await queryBuilder.exec();
  }

  async findOne(id: string) {
    const data = await this.shiftModel.findOne({ _id: id });

    if (!data) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);

    return data;
  }
  async update(id: string, updateData: UpdateShiftDto) {
    const data = await this.shiftModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!data) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);

    return data;
  }

  async delete(id: string) {
    // Step 1: Update all employees with the specified shift ID
    await this.shiftModel.updateMany(
      { shift: id }, // Find employees with the given shift ID
      { $set: { shift: null } } // Set shiftId to null
    );

    // Step 2: Delete the shift from the shifts collection
    const result = await this.shiftModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return { message: `Shift with ID ${id} and related employee shifts have been updated and deleted.` };
  }

  async bulkAssignShift(data: string[], shiftId: string) {
    // Step 1: Update all employees with the specified shift ID
    return await this.userModel.updateMany(
      { _id: { $in: data } }, // Find employees with the given shift ID
      { $set: { shift: shiftId } } // Set shiftId to null
    );
  }
}