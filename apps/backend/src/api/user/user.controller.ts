import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';

import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RmqService } from '@lib/rmq';
import { USERS_API_MAPS } from '@lib/common';
import { AccessGuard } from '@lib/guards';

import {
  HasAccess,
  PublicRoute,
  UserDetails,
  UserTypeAccess,
} from '@lib/decorators';

import {
  ChangePasswordDto,
  ListQueryDTO,
  LoginDto,
  UserDto,
  UserShiftChangeDto,
  UserStatusChangeDTO,
} from '@lib/dto';

import { USER_TYPE_MAP, UserDocument } from '@lib/database';

/**
 * ------------------------------------------------------------------
 * Swagger Group Name
 * ------------------------------------------------------------------
 */
@ApiTags('UsersApi')

/**
 * ------------------------------------------------------------------
 * Authentication Guard
 * ------------------------------------------------------------------
 * All routes require authentication by default.
 * Public routes use @PublicRoute().
 * ------------------------------------------------------------------
 */
@UseGuards(AccessGuard)

/**
 * ------------------------------------------------------------------
 * Swagger JWT Authorization
 * ------------------------------------------------------------------
 */
@ApiBearerAuth()

/**
 * ------------------------------------------------------------------
 * Base Route
 * ------------------------------------------------------------------
 * All endpoints start with:
 *
 * /user
 * ------------------------------------------------------------------
 */
@Controller('user')
export class UserController {
  /**
   * ------------------------------------------------------------------
   * Constructor Injection
   * ------------------------------------------------------------------
   * UserService -> Business Logic
   * RmqService  -> RabbitMQ Utilities
   * ------------------------------------------------------------------
   */
  constructor(
    private readonly userService: UserService,
    private readonly rmqService: RmqService,
  ) { }

  /**
   * ------------------------------------------------------------------
   * GET /user
   * ------------------------------------------------------------------
   * Get all users.
   *
   * Admin / HR:
   *   Can view complete user information.
   *
   * Other users:
   *   Can view limited fields only.
   * ------------------------------------------------------------------
   */
  @Get()
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  async getAllUser(
    @UserDetails() user: any,
    @Query() query: ListQueryDTO,
  ) {
    /**
     * Default population option
     */
    let populateOption: {
      path: string;
      select?: string;
    } = {
      path: 'userId',
    };

    /**
     * Check whether current user
     * is Admin or HR.
     */
    const isAdminOrHr = ['Admin', 'Hr'].includes(
      user?.userId?.role,
    );

    /**
     * Non-admin users receive
     * only selected fields.
     */
    if (!isAdminOrHr) {
      populateOption = {
        path: 'userId',
        select:
          'firstName lastName image gender role',
      };
    }

    return await this.userService.getAllUser(
      populateOption,
      query,
      isAdminOrHr,
    );
  }

  /**
   * ------------------------------------------------------------------
   * GET /user/get-single-user-from-empId/:id
   * ------------------------------------------------------------------
   * Fetch user by Employee ID.
   * ------------------------------------------------------------------
   */
  @Get('/get-single-user-from-empId/:id')
  getSingleUserFromEmpId(
    @Param('id') id: string,
  ) {
    return this.userService.getSingleUserFromEmpId(
      id,
    );
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/make-manager
   * ------------------------------------------------------------------
   * Promote user to Manager.
   * ------------------------------------------------------------------
   */
  @Post('make-manager')
  async createManager(
    @Body('user') user: string,
  ) {
    return await this.userService.updateUser(
      user,
      {
        isManager: true,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/remove-manager
   * ------------------------------------------------------------------
   * Remove manager privileges.
   * Also clears assigned users.
   * ------------------------------------------------------------------
   */
  @Post('remove-manager')
  async removeManager(
    @Body('user') user: string,
  ) {
    return await this.userService.updateUser(
      user,
      {
        isManager: false,
        assignedUsers: [],
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/login
   * ------------------------------------------------------------------
   * Public login endpoint.
   *
   * Generates JWT token after
   * validating credentials.
   * ------------------------------------------------------------------
   */
  @Post('login')
  @PublicRoute()
  async loginUser(
    @Body() loginData: LoginDto,
  ) {
    console.time('login');

    const data =
      await this.userService.loginUser(
        loginData,
      );

    console.timeEnd('login');

    return data;
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/change-password
   * ------------------------------------------------------------------
   * Logged-in user changes password.
   * ------------------------------------------------------------------
   */
  @Post('change-password')
  async changePassword(
    @Body()
    changePasswordDto: ChangePasswordDto,

    @UserDetails() user: any,
  ) {
    return await this.userService.changePassword(
      {
        ...changePasswordDto,
        user: user._id,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/forgot-password
   * ------------------------------------------------------------------
   * Placeholder endpoint.
   * Not implemented yet.
   * ------------------------------------------------------------------
   */
  @Post('forgot-password')
  async forgotPassword() {
    return {
      message: 'Forgot password',
    };
  }

  /**
   * ------------------------------------------------------------------
   * POST /user/reset-password
   * ------------------------------------------------------------------
   * Admin resets another user's password.
   * ------------------------------------------------------------------
   */
  @Post('reset-password')
  @HasAccess()
  async resetPassword(
    @Body() body: UserStatusChangeDTO,
  ) {
    return await this.userService.resetUserPassword(
      body,
    );
  }

  /**
   * ------------------------------------------------------------------
   * GET /user/dashboard
   * ------------------------------------------------------------------
   * Fetch dashboard information
   * for currently logged-in user.
   * ------------------------------------------------------------------
   */
  @Get('dashboard')
  async userDashboard(
    @UserDetails()
    user: UserDocument,
  ) {
    return await this.userService.getUserDashboard(
      user,
    );
  }

  /**
   * ------------------------------------------------------------------
   * PUT /user/disable
   * ------------------------------------------------------------------
   * Disable user account.
   * Also disables WFH.
   * ------------------------------------------------------------------
   */
  @Put('disable')
  @HasAccess()
  async disableUser(
    @Body() body: UserStatusChangeDTO,
  ) {
    return await this.userService.updateUser(
      body?.userId,
      {
        status: false,
        workfromhome: false,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * PUT /user/enable
   * ------------------------------------------------------------------
   * Enable user account.
   * ------------------------------------------------------------------
   */
  @Put('enable')
  @HasAccess()
  async enableUser(
    @Body() body: UserStatusChangeDTO,
  ) {
    return await this.userService.updateUser(
      body?.userId,
      {
        status: true,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * PUT /user/shift
   * ------------------------------------------------------------------
   * Assign shift to user.
   * ------------------------------------------------------------------
   */
  @Put('shift')
  @HasAccess()
  async assignShift(
    @Body() body: UserShiftChangeDto,
  ) {
    return await this.userService.updateUser(
      body?.userId,
      {
        shift: body?.shift,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * PUT /user/enable-wfh
   * ------------------------------------------------------------------
   * Enable Work From Home.
   * ------------------------------------------------------------------
   */
  @Put('enable-wfh')
  @HasAccess()
  async enableWFO(
    @Body() body: UserStatusChangeDTO,
  ) {
    return await this.userService.updateUser(
      body?.userId,
      {
        workfromhome: true,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * PUT /user/disable-wfh
   * ------------------------------------------------------------------
   * Disable Work From Home.
   * ------------------------------------------------------------------
   */
  @Put('disable-wfh')
  @HasAccess()
  async disableWFO(
    @Body() body: UserStatusChangeDTO,
  ) {
    return await this.userService.updateUser(
      body?.userId,
      {
        workfromhome: false,
      },
    );
  }

  /**
   * ------------------------------------------------------------------
   * GET /user/:id
   * ------------------------------------------------------------------
   * Fetch user by MongoDB ID.
   * ------------------------------------------------------------------
   */
  @Get(':id')
  async getUserById(
    @Param('id') userId: string,
  ) {
    return await this.userService.getPopulatedUser(
      userId,
    );
  }

  /**
   * ==============================================================
   * RabbitMQ Microservice Handlers
   * ==============================================================
   */

  /**
   * Register User
   */
  @MessagePattern({
    cmd: USERS_API_MAPS.REGISTER_USER,
  })
  async registerUser(
    @Payload() userDto: UserDto,
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);

    return await this.userService.registerUser(
      userDto,
    );
  }

  /**
   * Update Allocated Storage Size
   */
  @MessagePattern({
    cmd: USERS_API_MAPS.UPDATE_SIZEOF_FILE_ALLOCATED,
  })
  async updateSize(
    @Payload()
    payload: {
      id: string;
      size: number;
    },

    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);

    return await this.userService.updateUser(
      payload.id,
      {
        allocatedSpace: payload.size,
      },
    );
  }

  /**
   * Get User By ID
   */
  @MessagePattern({
    cmd: USERS_API_MAPS.GET_USER,
  })
  async getSingleUser(
    @Payload('id') id: string,
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);

    return await this.userService.getPopulatedUser(
      id,
    );
  }

  /**
   * Get Detailed User Information
   */
  @MessagePattern({
    cmd: USERS_API_MAPS.GET_USER_DETAILS,
  })
  async getUser(
    @Payload()
    payload: { id: string },

    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);

    return await this.userService.getPopulatedUser(
      payload?.id,
    );
  }

  /**
   * Delete User
   */
  @MessagePattern({
    cmd: USERS_API_MAPS.DELETE_USER,
  })
  async removeUser(
    @Payload()
    data: { id: string },

    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);

    return await this.userService.deleteUser(
      data.id,
    );
  }
}