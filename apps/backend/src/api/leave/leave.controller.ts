import {
  // BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
} from '@lib/dto/dtos/leave/leaveType.dto';
import { AccessGuard } from '@lib/guards';
import { HasAccess, UserDetails } from '@lib/decorators';
import { v4 as uuidv4 } from 'uuid';
import {
  FileMetadata,
  LeaveRequestDto,
  UpdateLeaveRequestDto,
} from '@lib/dto/dtos/leave/leaveRequest.dto';
import { FileUploadService } from '@app/file-upload';
import { RedisService } from '@app/cache/cache.service';
import {
  CreateEmployeeLeaveBalanceDto,

} from '@lib/dto/dtos/leave/employeeLeaveBalance.dto';
import {
  CreateLeaveHistoryDto,
  UpdateLeaveHistoryDto,
} from '@lib/dto/dtos/leave/leaveHistory.dto';

@ApiTags('Leave Management') // Groups endpoints under "Leave Management" in Swagger
@UseGuards(AccessGuard)
@Controller('leave')
@ApiBearerAuth()
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
    private readonly fileUploadService: FileUploadService,
    private readonly redisService: RedisService,
  ) { }

  @Post('leave-types')
  @HasAccess()
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiResponse({ status: 201, description: 'Leave type created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveService.create(createLeaveTypeDto);
  }

  @Get('leave-types')
  @ApiOperation({ summary: 'Get all leave types' })
  @ApiResponse({ status: 200, description: 'Returns all leave types' })
  async findAll() {
    return this.leaveService.findAll();
  }

  @Get('leave-types/:id')
  @ApiOperation({ summary: 'Get a leave type by ID' })
  @ApiResponse({ status: 200, description: 'Returns a leave type' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Patch('leave-types/:id')
  @HasAccess()
  @ApiOperation({ summary: 'Update a leave type' })
  @ApiResponse({ status: 200, description: 'Leave type updated successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveService.update(id, updateLeaveTypeDto);
  }

  @Delete('leave-types/:id')
  @HasAccess()
  @ApiOperation({ summary: 'Delete a leave type' })
  @ApiResponse({ status: 200, description: 'Leave type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }
  @Post('leave-request')
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiBody({ type: LeaveRequestDto }) // Specifies expected request body in Swagger
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async finalizeFileUpload(@Body() body: LeaveRequestDto, @UserDetails() user) {
    const file = await this.leaveService.postRequest(body, user);

    return {
      success: true,
      message: 'File upload finalized successfully',
      data: file,
    };
  }
  @Post('leave-request-upload-file/:leaveReqId')
  @ApiOperation({ summary: 'Upload proof' })
  @ApiBody({ type: [FileMetadata] }) // Accepts an array of FileMetadata objects
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  async createLeaveRequest(
    @Body() files: FileMetadata[],
    @Param('leaveReqId') leaveReqId: string,
    @UserDetails() user,
  ) {
    const userId = user?._id;

    const data = [];

    for (const file of files) {
      const fileKey = uuidv4(); // Unique ID for each file
      const key = `${userId}/leave/${leaveReqId}/${file.filename}`;
      await this.leaveService.saveDocument(key, leaveReqId);
      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename: key,
        type: file.type,
      });

      // Cache file metadata for later validation
      await this.redisService.setInCache(
        fileKey,
        JSON.stringify({
          filename: file.filename,
          key,
          size: file.size,
        }),
        1800000,
      );

      data.push({ fileKey, signedUrl });
    }
    await this.leaveService.upload(leaveReqId);

    return { message: 'Leave request submitted successfully', data };
  }

  @Get('/leave-request')
  @ApiOperation({ summary: 'Get all leave request details' })
  @ApiQuery({ name: 'leaveType', required: false, type: [String] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'leaveStatus', required: false, type: String })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    example: '2025-02-09',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    example: '2025-02-11',
  })
  async getAllLeaveRequests(@Query() query, @UserDetails() user) {
    const filter: any = {};
    const userId = user.userId._id;

    if (query.leaveType) {
      filter.leaveType = { $in: query.leaveType };
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.leaveStatus) {
      filter.leaveStatus = query.leaveStatus;
    }
    if (query.fromDate && query.toDate) {
      filter.createdAt = {
        $gte: new Date(query.fromDate), // Ensure createdAt is greater than or equal to fromDate
        $lte: new Date(query.toDate), // Ensure createdAt is less than or equal to toDate
      };
    }

    return this.leaveService.getAllLeaveRequests(
      filter,
      userId,
      user.userId.role,
      user._id,
    );
  }

  @Get('leave-request/me')
  @ApiOperation({ summary: 'Get all leave requests by user' })
  @ApiQuery({ name: 'leaveType', required: false, type: [String] })
  @ApiQuery({ name: 'leaveStatus', required: false, type: String })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    example: '2025-02-09',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    example: '2025-02-11',
  })
  async getMyLeaveRequests(@UserDetails() user, @Query() query) {
    const filter: any = {};

    if (query.leaveType) {
      filter.leaveType = { $in: query.leaveType };
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.leaveStatus) {
      filter.leaveStatus = query.leaveStatus;
    }
    if (query.fromDate && query.toDate) {
      filter.createdAt = {
        $gte: new Date(query.fromDate), // Ensure createdAt is greater than or equal to fromDate
        $lte: new Date(query.toDate), // Ensure createdAt is less than or equal to toDate
      };
    }

    return this.leaveService.getMyLeaveRequests(user._id, filter);
  }

  @Get('/leave-request/:leaveReqId')
  @ApiOperation({ summary: 'Get leave request details' })
  async getLeaveRequestById(@Param('leaveReqId') leaveReqId: string) {
    return this.leaveService.getLeaveRequestById(leaveReqId);
  }

  @Patch('/leave-request/:leaveReqId')
  @ApiOperation({
    summary:
      'Approve, Reject by reviewer or Update a leave request or cancel the request by the user who created',
  })
  @ApiBody({ type: UpdateLeaveRequestDto })
  async updateLeaveRequest(
    @UserDetails() user,
    @Param('leaveReqId') leaveReqId: string,
    @Body() updateData: any,
  ) {
    return this.leaveService.updateLeaveRequest(
      leaveReqId,
      updateData,
      user._id,
      user.userId._id,
      user.userId.role,
    );
  }
  // POST: Create Leave Balance (Only Admin/HR)
  @Post('leave-balance')
  @HasAccess()
  async createLeave(@Body() dto: CreateEmployeeLeaveBalanceDto) {
    return this.leaveService.createLeaveBalance(dto);
  }
  // GET /me: Fetch logged-in user’s leave balance
  @Get('leave-balance/me')
  async getUserLeave(@UserDetails() user) {
    return this.leaveService.getLeaveBalanceForUser(user._id);
  }

  // GET: Fetch all leave balances (Public)
  @Get('leave-balance/:id')
  async getLeaveBalances(@Param('id') id: string) {
    return this.leaveService.getLeaveBalances(id);
  }
  // PATCH: Update Leave Balance (Only Admin/HR)
  @Patch('/leave-balance/:id')
  @HasAccess()
  async updateLeave(@Param('id') id: string, @Body() dto: any) {
    return this.leaveService.updateLeaveBalance(id, dto);
  }

  @Post('/leave-history')
  createHistory(@Body() data: CreateLeaveHistoryDto) {
    return this.leaveService.createHistory(data);
  }

  @Get('/leave-history')
  findAllHistory(@UserDetails() user: any) {
    return this.leaveService.findAllHistory(user._id);
  }

  @Get('/leave-history/:id')
  findOneHistory(@Param('id') id: string) {
    return this.leaveService.findOneHistory(id);
  }

  @Put('/leave-history/:id')
  updateHistory(@Param('id') id: string, @Body() data: UpdateLeaveHistoryDto) {
    return this.leaveService.updateHistory(id, data);
  }

  @Delete('/leave-history/:id')
  removeHistory(@Param('id') id: string) {
    return this.leaveService.removeHistory(id);
  }
  @Get('/not-assigned-leave-user')
  getNotAssignedLeaveUser() {
    return this.leaveService.getEmployeesWithOutdatedLeaveBalance();
  }
}
