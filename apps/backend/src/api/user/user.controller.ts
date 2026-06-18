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


@ApiTags('UsersApi')
@UseGuards(AccessGuard)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rmqService: RmqService,
  ) { }

  @Get()
  @UserTypeAccess(USER_TYPE_MAP.EMPLOYEE)
  async getAllUser(@UserDetails() user: any, @Query() query: ListQueryDTO) {
    //For Admin and hr to get all user details
    let populateOption: { path: string; select?: string } = { path: 'userId' };

    const isAdminOrHr = ['Admin', 'Hr'].includes(user?.userId?.role);

    //if not admin or hr only get selected details
    if (!isAdminOrHr) {
      populateOption = {
        path: 'userId',
        select: 'firstName lastName image gender role',
      };
    }
    const dta = await this.userService.getAllUser(
      populateOption,
      query,
      isAdminOrHr,
    );

    return dta;
  }
  @Get('/get-single-user-from-empId/:id')
  getSingleUserFromEmpId(@Param('id') id: string) {
    return this.userService.getSingleUserFromEmpId(id);
  }

  @Post('make-manager')
  async createManager(@Body('user') user: string) {
    return await this.userService.updateUser(user, { isManager: true });
  }

  @Post('remove-manager')
  async removeManager(@Body('user') user: string) {
    return await this.userService.updateUser(user, {
      isManager: false,
      assignedUsers: [],
    });
  }

  @Post('login')
  @PublicRoute()
  async loginUser(@Body() loginData: LoginDto) {
    // testing delay
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 10000);
    // });
    console.time('login');
    const data = await this.userService.loginUser(loginData);
    console.timeEnd('login');
    return data;
  }

  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @UserDetails() user: any,
  ) {
    const data = await this.userService.changePassword({
      ...changePasswordDto,
      user: user._id,
    });
    return data;
  }

  @Post('forgot-password')
  async forgotPassword() {
    return { message: 'Forgot password' };
  }

  @Post('reset-password')
  @HasAccess()
  async resetPassword(@Body() body: UserStatusChangeDTO) {
    // testing delay
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 10000);
    // });
    const data = await this.userService.resetUserPassword(body);
    return data;
  }

  //Dashboard
  @Get('dashboard')
  async userDashboard(@UserDetails() user: UserDocument) {
    const data = await this.userService.getUserDashboard(user);
    return data;
  }

  @Put('disable')
  @HasAccess()
  async disableUser(@Body() body: UserStatusChangeDTO) {
    // this.logger.log("Disabling")
    const data = await this.userService.updateUser(body?.userId, {
      status: false,
      workfromhome: false,
    });
    return data;
  }

  @Put('enable')
  @HasAccess()
  async enableUser(@Body() body: UserStatusChangeDTO) {
    // this.logger.log("Enabling")
    const data = await this.userService.updateUser(body?.userId, {
      status: true,
    });
    return data;
  }

  @Put('shift')
  @HasAccess()
  async assignShift(@Body() body: UserShiftChangeDto) {
    const data = await this.userService.updateUser(body?.userId, {
      shift: body?.shift,
    });
    return data;
  }

  @Put('enable-wfh')
  @HasAccess()
  async enableWFO(@Body() body: UserStatusChangeDTO) {
    // this.logger.log("Enabling WFH")
    const data = await this.userService.updateUser(body?.userId, {
      workfromhome: true,
    });
    return data;
  }

  @Put('disable-wfh')
  @HasAccess()
  async disableWFO(@Body() body: UserStatusChangeDTO) {
    // this.logger.log("Disable WFH")
    const data = await this.userService.updateUser(body?.userId, {
      workfromhome: false,
    });
    return data;
  }

  /**
   *
   *dynamic routes started from here
   */

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    return await this.userService.getPopulatedUser(userId);
  }

  /**
   * microservice routes started from here :
   *
   *
   */

  @MessagePattern({ cmd: USERS_API_MAPS.REGISTER_USER })
  async registerUser(@Payload() userDto: UserDto, @Ctx() context: RmqContext) {
    this.rmqService.ack(context);
    return await this.userService.registerUser(userDto);
  }

  @MessagePattern({ cmd: USERS_API_MAPS.UPDATE_SIZEOF_FILE_ALLOCATED })
  async updateSize(
    @Payload() payload: { id: string; size: number },
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);
    return await this.userService.updateUser(payload.id, {
      allocatedSpace: payload.size,
    });
  }

  @MessagePattern({ cmd: USERS_API_MAPS.GET_USER })
  async getSingleUser(@Payload('id') id: string, @Ctx() context: RmqContext) {
    this.rmqService.ack(context);
    const userData = await this.userService.getPopulatedUser(id);
    return userData;
  }

  @MessagePattern({ cmd: USERS_API_MAPS.GET_USER_DETAILS })
  async getUser(
    @Payload() payload: { id: string },
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);
    return await this.userService.getPopulatedUser(payload?.id);
  }

  @MessagePattern({ cmd: USERS_API_MAPS.DELETE_USER })
  async removeUser(
    @Payload() data: { id: string },
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);
    return await this.userService.deleteUser(data.id);
  }

  // TODO: Only for development purpose
  // @Post('reset-storage')
  // @ApiBearerAuth()
  // @HasAccess('admin')
  // async resetAllUsersStorage() {
  //   try {
  //     const DEFAULT_STORAGE = 1024 * 1024 * 1024; // 1GB in bytes

  //     // Reset all users' storage
  //     await this.userService.resetAllUsersStorage(DEFAULT_STORAGE);

  //     // Delete all files
  //     await this.fileService.deleteAllFiles();

  //     return { message: 'Storage reset completed successfully' };
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to reset storage');
  //   }
  // }
}
