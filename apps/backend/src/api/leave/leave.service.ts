import { Employee, User, UserDocument } from '@lib/database';
import { EmployeeLeaveBalance } from '@lib/database/schemas/leave/employeeLeaveBalance.schema';
// import mongoose from 'mongoose';

import {
  LeaveHistory,
  LeaveHistoryDocument,
} from '@lib/database/schemas/leave/leaveHistory.schema';
import { LeaveRequest } from '@lib/database/schemas/leave/leaveRequest.schema';
import {
  LeaveType,
  LeaveTypeDocument,
} from '@lib/database/schemas/leave/leaveType.schema';
import { CreateEmployeeLeaveBalanceDto } from '@lib/dto/dtos/leave/employeeLeaveBalance.dto';
import { LeaveRequestDto } from '@lib/dto/dtos/leave/leaveRequest.dto';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
} from '@lib/dto/dtos/leave/leaveType.dto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);
  constructor(
    @InjectModel(User.name) public readonly userModel: Model<User>,
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequest>,
    @InjectModel(EmployeeLeaveBalance.name)
    private employeeLeaveBalanceModel: Model<EmployeeLeaveBalance>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(LeaveHistory.name)
    private leaveHistoryModel: Model<LeaveHistoryDocument>,
  ) { }

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveType> {
    const leaveType = new this.leaveTypeModel(createLeaveTypeDto);
    return leaveType.save();
  }
  async saveDocument(key: string, leaveReqId: string) {
    const leaveRequest = await this.leaveRequestModel.findById(leaveReqId);
    leaveRequest.documentPaths.push(key);
    await leaveRequest.save();
  }

  async findAll(): Promise<LeaveType[]> {
    return this.leaveTypeModel.find().exec();
  }

  async findOne(id: string): Promise<LeaveType> {
    const leaveType = await this.leaveTypeModel.findById(id).exec();
    if (!leaveType) {
      throw new NotFoundException('Leave Type not found');
    }
    return leaveType;
  }

  async update(
    id: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    const updatedLeaveType = await this.leaveTypeModel
      .findByIdAndUpdate(id, updateLeaveTypeDto, { new: true })
      .exec();
    if (!updatedLeaveType) {
      throw new NotFoundException('Leave Type not found');
    }
    return updatedLeaveType;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.leaveTypeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Leave Type not found');
    }
    return { message: 'Leave Type deleted successfully' };
  }
  async postRequest(
    body: LeaveRequestDto,
    // filePath: string,
    user: any,
  ): Promise<any> {
    try {
      const userId = user._id;

      const currentReviewer = user.userId.reportsTo;
      const approversList = [];
      approversList.push({
        order: 1,
        reviewer: currentReviewer,
        status: 'PENDING',
      });
      const activities = [];
      activities.push({
        date: new Date(),
        status: 'APPLIED',
        description: 'You have applied for a Leave',
      });
      const forwardedToName = await this.employeeModel.findById({
        _id: user.userId.reportsTo,
      });
      console.log('------------------------------->', forwardedToName);

      activities.push({
        date: new Date().toString(),
        status: 'PENDING',
        description: `Your application is forwarded to ${forwardedToName?.firstName ?? ''} ${forwardedToName.lastName ?? ''}`,
      });

      const newFile = await this.leaveRequestModel.create({
        userId,
        currentReviewer,
        approversList,
        updatedBy: userId,
        leaveStatus: 'APPLIED',
        activities,
        ...body,
      });

      return newFile;
    } catch (error) {
      this.logger.log(error);
      throw new Error('Failed to save file to the database.');
    }
  }
  async getAllLeaveRequests(
    query: any,
    empId: string,
    role: string,
    userId: string,
  ) {
    if (role === 'Hr' || role === 'Admin') {
      return this.leaveRequestModel
        .find({ ...query, userId: { $ne: userId } })
        .populate('userId')
        .populate({
          path: 'userId',
          populate: {
            path: 'userId',
            model: 'Employee',
          },
        })
        .populate('leaveType')
        .populate('currentReviewer')
        .populate('updatedBy')
        .populate('approversList.reviewer')
        .exec();
    } else {
      return this.leaveRequestModel
        .find({ ...query, currentReviewer: empId }) // Ensure currentReviewer is filtered
        .populate('userId')
        .populate({
          path: 'userId',
          populate: {
            path: 'userId',
            model: 'Employee',
          },
        })
        .populate('leaveType')
        .populate('currentReviewer')
        .populate('updatedBy')
        .populate('approversList.reviewer')
        .exec();
    }
  }

  async getLeaveRequestById(leaveId: string) {
    return this.leaveRequestModel
      .findById(leaveId)
      .populate('userId')
      .populate({
        path: 'userId',
        populate: {
          path: 'userId',
          model: 'Employee',
        },
      })
      .populate('leaveType')
      .populate('currentReviewer')
      .populate('updatedBy')
      .populate('approversList.reviewer')
      .exec();
  }

  async getMyLeaveRequests(userId: string, query: any) {
    return this.leaveRequestModel
      .find({ userId: userId, ...query })
      .populate('userId')
      .populate({
        path: 'userId',
        populate: {
          path: 'userId',
          model: 'Employee',
        },
      })
      .populate('leaveType')
      .populate('currentReviewer')
      .populate('updatedBy')
      .populate('approversList.reviewer')
      .exec();
  }
  async upload(leaveId: string) {
    const leaveRequest = await this.leaveRequestModel.findById(leaveId).exec();
    leaveRequest.activities.push({
      date: new Date().toString(),
      status: 'UPLOADED',
      description: 'You have uploaded leave application supporting file(s)',
    });
    await leaveRequest.save();
  }

  async updateLeaveRequest(leaveId, updateData, userId, empId, role) {
    console.log('Fetching leave request...');
    const leaveRequest = await this.leaveRequestModel.findById(leaveId).exec();

    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    let { updatedData: data } = updateData;
    if (!data) data = updateData.updateData;

    const reviewer = await this.employeeModel.findById(
      leaveRequest.currentReviewer,
    );
    let leaveDeduction = 0;
    const activities = leaveRequest.activities || [];
    const currentYear = new Date().getFullYear();
    let leaveStatus = leaveRequest.leaveStatus;

    if (userId === leaveRequest.userId.toString()) {
      if (leaveStatus !== 'APPLIED')
        throw new UnauthorizedException('Cannot update reviewed leave request');

      if (data.leaveStatus === 'CANCELLED') {
        leaveStatus = 'CANCELLED';
        data.currentReviewer = null;
        activities.push({
          date: new Date().toISOString().split('T')[0],
          status: 'CANCELLED',
          description: `You have cancelled your ${(leaveRequest.leaveType as any)?.name || ''}.`,
        });
      }
    }

    if (empId === leaveRequest.currentReviewer?.toString()) {
      if (data.leaveStatus === 'CANCELLED') {
        if (leaveStatus === 'APPROVED') {
          const deduction =
            (leaveRequest.deductedLeaveBalance || 0) +
            (leaveRequest.sandwichLeaveDeduction || 0);
          leaveDeduction = leaveRequest.deductedLeaveBalance;

          console.log(
            `Reverting ${deduction} leave balance for ${leaveRequest.userId}`,
          );

          await this.employeeLeaveBalanceModel.findOneAndUpdate(
            { userId: leaveRequest.userId, year: currentYear },
            { $inc: { remainingPaidLeave: deduction } },
            { new: true },
          );

          await this.createHistory({
            userId: leaveRequest.userId,
            leaveId: leaveRequest.leaveType,
            message: `Your leave balance is credited with ${deduction} leave points by ${reviewer?.firstName ?? ''} ${reviewer?.lastName ?? ''}.`,
            transactionType: 'CREDIT',
            leaveAmount: deduction,
          });
        }

        leaveStatus = 'CANCELLED';
        data.currentReviewer = null;
        activities.push({
          date: new Date().toISOString().split('T')[0],
          status: 'CANCELLED',
          description: `Your ${(leaveRequest.leaveType as any)?.name} leave request was cancelled by ${reviewer?.firstName ?? ''} ${reviewer?.lastName ?? ''}.`,
        });
      }
    }

    if (['Admin', 'Hr'].includes(role) && data.leaveStatus === 'CANCELLED') {
      leaveStatus = 'CANCELLED';
      if (leaveRequest.leaveStatus === 'APPROVED') {
        const deduction =
          (leaveRequest.deductedLeaveBalance || 0) +
          (leaveRequest.sandwichLeaveDeduction || 0);
        leaveDeduction = leaveRequest.deductedLeaveBalance;
        console.log('----------------------------------------->');

        this.logger.log(leaveDeduction);

        console.log(
          `Refunding ${deduction} leave balance for ${leaveRequest.userId}`,
        );
        await this.employeeLeaveBalanceModel.findOneAndUpdate(
          { userId: leaveRequest.userId, year: currentYear },
          { $inc: { remainingPaidLeave: deduction } },
          { new: true },
        );
        await this.createHistory({
          userId: leaveRequest.userId,
          leaveId: leaveRequest.leaveType,
          message: `Your leave balance was credited back with ${deduction} leave points by HR.`,
          transactionType: 'CREDIT',
          leaveAmount: deduction,
        });
      }
      activities.push({
        date: new Date().toISOString().split('T')[0],
        status: 'CANCELLED',
        description: `HR/Admin has cancelled your leave request.`,
      });
      data.currentReviewer = null;
    }

    if (data.currentReviewerStatus === 'APPROVED') {
      if (!data.forwardTo) {
        const deduction =
          (data.deductedLeaveBalance || 0) + (data.sandwichLeaveDeduction || 0);
        const leaveBalance = await this.employeeLeaveBalanceModel.findOne({
          userId: leaveRequest.userId,
          year: currentYear,
        });
        leaveDeduction = data.deductedLeaveBalance || 0;

        this.logger.log(leaveDeduction);
        let paidLeave = leaveBalance.remainingPaidLeave || 0;
        let unpaidLeave = leaveBalance.unpaidLeave || 0;

        if (deduction > paidLeave) {
          unpaidLeave += deduction - paidLeave;
          paidLeave = 0;
        } else {
          paidLeave -= deduction;
        }

        if (paidLeave === 0) {
          unpaidLeave += deduction;
        }

        console.log(
          `Deducting ${deduction} leave balance for ${leaveRequest.userId}, Paid Leave: ${paidLeave}, Unpaid Leave: ${unpaidLeave}`,
        );
        await this.employeeLeaveBalanceModel.findOneAndUpdate(
          { userId: leaveRequest.userId, year: currentYear },
          { remainingPaidLeave: paidLeave, unpaidLeave: unpaidLeave },
          { new: true },
        );
        await this.createHistory({
          userId: leaveRequest.userId,
          leaveId: leaveRequest.leaveType,
          message: `Your leave balance was debited with ${deduction} leave points. Paid: ${paidLeave}, Unpaid: ${unpaidLeave} by ${reviewer?.firstName ?? ''} ${reviewer?.lastName ?? ''}.`,
          transactionType: 'DEBIT',
          leaveAmount: deduction,
        });

        leaveStatus = 'APPROVED';
        data.currentReviewer = null;
      }
      activities.push({
        date: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        description: `${reviewer.firstName} ${reviewer.lastName}has cancelled your leave request.`,
      });
    }
    // Forwarding logic (change reviewer)
    if (data.forwardTo) {
      const forwardedTo = await this.employeeModel.findById(data.forwardTo);
      leaveStatus = 'PENDING';

      activities.push({
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        description: `Your application was forwarded to ${forwardedTo?.firstName ?? ''} ${forwardedTo?.lastName ?? ''}.`,
      });

      data.currentReviewer = data.forwardTo;
      data.approversList = leaveRequest.approversList;
      data.approversList.push({
        order: leaveRequest.approversList.length + 1,
        reviewer: data.forwardTo,
        status: 'PENDING',
      });
    }
    console.log('Updating leave request...');
    return await this.leaveRequestModel.findByIdAndUpdate(leaveId, {
      ...leaveRequest.toObject(),
      leaveDuration: data.leaveDuration || leaveRequest.leaveDuration,
      updatedBy: userId,
      activities,
      leaveStatus,
      reasonForLeave: data.reasonForLeave || leaveRequest.reasonForLeave,
      leaveType: data.leaveType || leaveRequest.leaveType,
      currentReviewer: data.currentReviewer,
      deductedLeaveBalance: data.deductedLeaveBalance,
    });
  }

  async createLeaveBalance(
    dto: CreateEmployeeLeaveBalanceDto,
  ): Promise<EmployeeLeaveBalance> {
    const leave = new this.employeeLeaveBalanceModel(dto);
    return leave.save();
  }

  // Get All Employee Leave Balances
  async getLeaveBalances(id: string): Promise<EmployeeLeaveBalance[]> {
    const user: any = await this.getSingleUserFromEmpId(id);
    return this.employeeLeaveBalanceModel
      .find({ userId: user?._id })
      .populate({ path: 'userId', populate: { path: 'shift' } })
      .exec();
  }

  // Get Leave Balance of Logged-in User
  async getLeaveBalanceForUser(
    userId: string,
  ): Promise<EmployeeLeaveBalance[]> {
    return this.employeeLeaveBalanceModel
      .find({ userId, year: new Date().getFullYear() })
      .exec();
  }

  // Update Employee Leave Balance (Admin/HR)
  async updateLeaveBalance(id: string, dto: any) {
    const { leaveBalance } = dto;

    const currentYear = new Date().getFullYear();
    const user = await this.getSingleUserFromEmpId(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if leave balance document exists for the user in the current year
    let leaveBalanceDoc;
    if (typeof user === 'object' && '_id' in user) {
      leaveBalanceDoc = await this.employeeLeaveBalanceModel.findOne({
        userId: user?._id.toString(),
        year: currentYear,
      });
    }

    if (!leaveBalanceDoc && typeof user === 'object' && '_id' in user) {
      // If no document exists, create a new one
      leaveBalanceDoc = await this.employeeLeaveBalanceModel.create({
        userId: user?._id.toString(),
        year: currentYear,
        totalPaidLeave: leaveBalance,
        remainingPaidLeave: leaveBalance,
        // reason: reason, // Store reason for tracking purpose
      });
      // await leaveBalanceDoc.save();
    } else {
      // If document exists, update totalPaidLeave and remainingPaidLeave
      leaveBalanceDoc.totalPaidLeave += leaveBalance;
      leaveBalanceDoc.remainingPaidLeave += leaveBalance;
      // leaveBalanceDoc.reason = reason; // Update the reason
      await leaveBalanceDoc.save();
    }
    await this.createHistory({
      userId: typeof user === 'object' && '_id' in user && user._id.toString(),
      leaveId: null,
      message: `Your leave balance is credited with ${leaveBalance} leave points.`,
      transactionType: 'CREDIT',
      leaveAmount: leaveBalance,
    });
    return leaveBalanceDoc;
  }

  async createHistory(data: Partial<LeaveHistory>): Promise<LeaveHistory> {
    return this.leaveHistoryModel.create(data);
  }

  async findAllHistory(id: string): Promise<LeaveHistory[]> {
    return this.leaveHistoryModel
      .find({ userId: id })
      .populate('userId leaveId')
      .exec();
  }

  async findOneHistory(id: string): Promise<LeaveHistory> {
    const history = await this.leaveHistoryModel
      .findById(id)
      .populate('userId leaveId')
      .exec();
    if (!history) throw new NotFoundException('Leave history not found');
    return history;
  }

  async updateHistory(
    id: string,
    data: Partial<LeaveHistory>,
  ): Promise<LeaveHistory> {
    const updatedHistory = await this.leaveHistoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updatedHistory) throw new NotFoundException('Leave history not found');
    return updatedHistory;
  }

  async removeHistory(id: string): Promise<void> {
    const result = await this.leaveHistoryModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Leave history not found');
  }

  async getEmployeesWithOutdatedLeaveBalance() {
    const currentYear = new Date().getFullYear();

    // Step 1: Fetch all employees
    const allEmployees = await this.userModel
      .find({ userType: 'Employee' })
      .lean();

    // Step 2: Fetch all leave balances for 2025
    const leaveBalances = await this.employeeLeaveBalanceModel
      .find({ year: currentYear })
      .lean();

    // Step 3: Extract employee IDs who have 2025 leave balance
    const employeesWithCurrentYearBalance = new Set(
      leaveBalances.map((lb) => lb.userId.toString()),
    );

    // Step 4: Filter employees who do NOT have a 2025 leave balance
    const employeesWithoutCurrentYearBalance = allEmployees.filter(
      (emp) => !employeesWithCurrentYearBalance.has(emp._id.toString()),
    );

    return employeesWithoutCurrentYearBalance;
  }
  async getSingleUserFromEmpId(employeeId: string) {
    // Step 1: Find the user corresponding to the given employee ID
    const user = await this.userModel
      .findOne({ userId: employeeId })
      .populate('userId') // Populates `userId` field
      .lean();
    if (!user) {
      return { message: 'Employee not found' };
    }
    return user;
  }
}
