import { AccessGuard } from '@lib/guards';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Logger,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from '../service/employee.service';
import { DepartmentsService } from '../service/departments.service';
import { HasAccess, UserDetails } from '@lib/decorators';
import {
  AddDepartmentDto,
  AddDesignationDto,
  AddEmployeeDto,
  // EmployeeAddressDto,
  ListQueryDTO,
  UpdateEmployeeDto,
} from '@lib/dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { EMPLOYEE_API_MAPS, generateRandomString } from '@lib/common';
import { FileUploadService } from '@app/file-upload';
import {
  AddEmergencyContactDto,
  UpdateEmergencyContactInfoDto,
} from '@lib/dto/dtos/employee/emergencyContactInfo.dto';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService } from '@lib/rmq';

import { AddAddressDto } from '@lib/dto/dtos/employee/address.dto';
// import { AddAddressDto } from '@lib/dto/dtos/employee/address.dto';

@ApiTags('EmployeesApi')
@UseGuards(AccessGuard)
@Controller('employee')
@ApiBearerAuth()
export class EmployeeController {
  private logger = new Logger(EmployeeController.name);

  constructor(
    private readonly employeeService: EmployeesService,
    private readonly departmentService: DepartmentsService,
    private readonly fileUploadService: FileUploadService,
    private readonly rmqService: RmqService,
  ) { }

  @Post('department')
  @HasAccess()
  async addDepartment(@Body() body: AddDepartmentDto) {
    const dta = await this.departmentService.addDepartment(body);
    return dta;
  }

  @Get('department')
  @HasAccess()
  async listDepartment() {
    const dta = await this.departmentService.getDepartment();
    return dta;
  }
  @Get('getMyStatus')
  async getMyStatus(@UserDetails() user: any) {
    // if user ask for their own details or the requester must be either admin or hr

    // const d = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS }, id).toPromise();

    return { status: user.status };
  }

  @Post('designation')
  @HasAccess()
  async addDesignation(@Body() body: AddDesignationDto) {
    const dta = await this.departmentService.addDesignation(body);
    return dta;
  }

  @Get('designation')
  @HasAccess()
  async listDesignation(
    @UserDetails() user: any,
    @Query('department') department?: string,
  ) {
    let data = null;
    if (department)
      data = await this.departmentService.getDesignation(department);
    else data = await this.departmentService.getDesignation();

    return data;
  }

  // employee

  @Post()
  @HasAccess()
  async createEmployee(@Body() body: AddEmployeeDto) {
    const dta = await this.employeeService.createEmployee(body);
    return dta;
  }

  @Get()
  // @HasAccess()
  async listAllEmployee(@Query() query: ListQueryDTO, @UserDetails() user: any) {
    const allEmployee = await this.employeeService.listEmployee(query, user);
    return allEmployee;
  }


  @Get('contact-info/:id')
  async getEmployeeContactInfo(
    @UserDetails() user: any,
    @Param('id') id: string,
  ) {
    const employee = await this.employeeService.getEmployeeContactInfo(id);
    return {
      success: true,
      statusCode: 200,
      data: employee,
      message: 'Employee data fetched successfully!',
    };
  }
  // @Get('contact-info/:id')
  // async getEmployeeAddress(@Param('id') id: string) {
  //   const employee = await this.employeeService.getEmployeeContactInfo(id);
  //   return {
  //     success: true,
  //     statusCode: 200,
  //     data: employee,
  //     message: 'Employee data fetched successfully!',
  //   };
  // }
  @Get(':id')
  async getEmployeeDetails(@Param('id') id: string, @UserDetails() user: any) {
    // if user ask for their own details or the requester must be either admin or hr
    if (
      !['Admin', 'Hr'].includes(user?.userId?.role) &&
      user?.userId?._id !== id
    ) {
      return { message: 'Insufficient Permission', success: false };
    }
    // const d = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS }, id).toPromise();
    const d = await this.employeeService.getEmployeeDetails(id);
    return d;
  }



  @MessagePattern({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS })
  async getEmployeeDetailsById(@Payload() id: string, @Ctx() context: RmqContext) {

    const d = await this.employeeService.getEmployeeDetails(id);
    this.rmqService.ack(context);
  
    return d;
  }

  @Put()
  @HasAccess()
  async updateEmployee(
    @Body() body: UpdateEmployeeDto,
    @UserDetails() user: any,
  ) {
    // requester must be either admin or hr

    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    // return this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.UPDATE_EMPLOYEE }, { ...body })
    const d = await this.employeeService.updateEmployee(body);

    return d;
  }
  @Put('department/:id')
  @HasAccess()
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: AddDepartmentDto,
  ) {
    const updatedDepartment = await this.departmentService.updateDepartment(
      id,
      body,
    );
    return updatedDepartment;
  }
  @Put('designation/:id')
  @HasAccess()
  async updateDesignation(
    @Param('id') id: string,
    @Body() body: AddDesignationDto,
  ) {
    const updatedDesignation = await this.departmentService.updateDesignation(
      id,
      body,
    );
    return updatedDesignation;
  }

  @Put('banner')
  @UseInterceptors(FileInterceptor('banner'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file',
        },
      },
    },
  })
  async updateBannerPic(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    banner: Express.Multer.File,
    @UserDetails() user: any,
  ) {
    if (user && user?.userId) {
      // const { message, success, data: userData } = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS }, user?.userId?._id).toPromise();
      const {
        message,
        success,
        data: userData,
      } = await this.employeeService.getEmployeeDetails(user?.userId?._id);
      if (success) {
        // this.logger.log(userData);
        // deleting previous image
        if (userData?.basicDetails?.banner) {
          // console.log(userData);
          this.fileUploadService.deleteFile(userData?.basicDetails?.banner);
        }
        // this.logger.log(userData);
        //creating filename
        let fileName = `${generateRandomString(20)}.${banner.mimetype.split('/')[1]
          }`;
        fileName = `${user?.userId?._id}/profile/${fileName}`;
        this.fileUploadService.uploadFile(banner.buffer, fileName);

        // calling employee microservice
        // const data = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.UPDATE_EMPLOYEE }, { employeeId: userData?.basicDetails?.employeeId, image: fileName }).toPromise();
        const data = await this.employeeService.updateEmployee({
          employeeId: userData?.basicDetails?.employeeId,
          banner: fileName,
        });
        return data;
      }
      return { message, success };
    }
    return { message: 'Something went wrong', success: false };
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data') // Specify that this endpoint consumes multipart data
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary', // Specify that this is a binary file
          description: 'Profile image file',
        },
      },
    },
  })
  async updateProfilePic(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
    @UserDetails() user: any,
  ) {
    // console.log(user);

    if (user && user?.userId) {
      // const { message, success, data: userData } = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS }, user?.userId?._id).toPromise();
      const {
        message,
        success,
        data: userData,
      } = await this.employeeService.getEmployeeDetails(user?.userId?._id);
      if (success) {
        // this.logger.log(userData);
        // deleting previous image
        if (userData?.basicDetails?.image) {
          this.fileUploadService.deleteFile(userData?.basicDetails?.image);
        }
        // this.logger.log(userData);
        //creating filename
        let fileName = `${generateRandomString(20)}.${image.mimetype.split('/')[1]
          }`;
        fileName = `${user?.userId?._id}/profile/${fileName}`;
        // console.log(userData);

        // uploading the file to aws se
        this.fileUploadService.uploadFile(image.buffer, fileName);

        // calling employee microservice
        // const data = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.UPDATE_EMPLOYEE }, { employeeId: userData?.basicDetails?.employeeId, image: fileName }).toPromise();
        const data = await this.employeeService.updateEmployee({
          employeeId: userData?.basicDetails?.employeeId,
          image: fileName,
        });
        return data;
      }
      return { message, success };
    }
    return { message: 'Something went wrong', success: false };
  }

  @Patch('contact/:type')
  @ApiQuery({
    name: 'operation',
    description: 'The operation to perform (add or delete)',
    enum: ['add', 'delete'],
  })
  @ApiBody({
    description: 'The contact information (phone number or email ID)',
    schema: {
      example: {
        identifier: '+1234567890', // Phone number or email ID
      },
    },
  })
  @ApiParam({
    name: 'type',
    description: 'Type of contact (phone-numbers or email-ids)',
    enum: ['phone-numbers', 'email-ids'],
  })
  @ApiResponse({ status: 200, description: 'Operation successful' })
  @ApiResponse({ status: 404, description: 'Contact not found (for delete)' })
  async modifyContact(
    @UserDetails() user: any,
    @Param('type') type: 'phone-numbers' | 'email-ids',
    @Query('operation') operation: 'add' | 'delete',
    @Body() body: { identifier: string },
  ) {
    const userId = user?.userId?._id;

    if (operation === 'add') {
      if (type === 'phone-numbers') {
        return this.employeeService.addPhoneNumbers(userId, body.identifier);
      } else if (type === 'email-ids') {
        return this.employeeService.addEmailIds(userId, body.identifier);
      } else {
        throw new Error('Invalid type for add operation');
      }
    } else if (operation === 'delete') {
      if (type === 'phone-numbers') {
        return this.employeeService.deletePhoneNumber(userId, body.identifier);
      } else if (type === 'email-ids') {
        return this.employeeService.deleteEmailId(userId, body.identifier);
      } else {
        throw new Error('Invalid type for delete operation');
      }
    } else {
      throw new Error('Invalid operation');
    }
  }

  @Post('employee-address')
  @ApiBody({
    description: 'Add an emergency contact',
    type: AddAddressDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Emergency contact added successfully',
  })
  async postAddress(@UserDetails() user: any, @Body() dto: AddAddressDto) {
    console.log(dto);

    return this.employeeService.postAddress(user?.userId?._id, dto);
  }
  @Post('emergency-contacts')
  @ApiBody({
    description: 'Add an emergency contact',
    type: AddEmergencyContactDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Emergency contact added successfully',
  })
  async addEmergencyContact(@UserDetails() user: any, @Body() dto: any) {
    return this.employeeService.addEmergencyContact(user?.userId?._id, dto);
  }

  @Delete()
  @HasAccess()
  async deleteEmployee(@Body() body: { id: string }, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }
    const { id } = body;
    if (id) {
      // const data = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.DELETE_EMPLOYEE }, { id }).toPromise();
      const data = await this.employeeService.deleteEmployee(id);
      return data;
    }
    return { message: 'Please provide id of employee', success: false };
  }
  @Delete('department/:id')
  @HasAccess()
  async deleteDepartment(@Param('id') id: string, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }

    if (id) {
      // const data = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.DELETE_EMPLOYEE }, { id }).toPromise();
      const data = await this.departmentService.deleteDepartment(id);
      return data;
    }
    return { message: 'Please provide id of employee', success: false };
  }
  @Delete('designation/:id')
  @HasAccess()
  async deleteDesignation(@Param('id') id: string, @UserDetails() user: any) {
    if (!['Admin', 'Hr'].includes(user?.userId?.role)) {
      return { message: 'Insufficient Permission', success: false };
    }

    if (id) {
      // const data = await this.employeeClient.send({ cmd: EMPLOYEE_API_MAPS.DELETE_EMPLOYEE }, { id }).toPromise();
      const data = await this.departmentService.deleteDesignation(id);
      return data;
    }
    return { message: 'Please provide id of employee', success: false };
  }

  @Patch('update-emergency-contacts/:contactId')
  @ApiParam({
    name: 'contactId',
    description: 'ID of the emergency contact to modify',
  })
  @ApiQuery({
    name: 'operation',
    description:
      'The operation to perform (update, delete-phone, delete-email)',
    required: true,
    enum: ['update', 'delete-phone', 'delete-email'],
  })
  @ApiResponse({
    status: 200,
    description: 'Operation performed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found',
  })
  @ApiBody({ required: false, type: UpdateEmergencyContactInfoDto })
  async handleEmergencyContact(
    @Param('contactId') contactId: string,
    @Query('operation') operation: string,
    @Body() body?: any,
  ) {
    switch (operation) {
      case 'update':
        if (!body) {
          throw new BadRequestException(
            'Update data is required for this operation.',
          );
        }
        return this.employeeService.updateEmergencyContact(contactId, body);

      case 'delete-phone':
        if (!body || !body.phoneNumber) {
          throw new BadRequestException(
            'Phone number is required for deletion.',
          );
        }
        return this.employeeService.deleteEmergencyContactPhoneNumber(
          contactId,
          body.phoneNumber,
        );

      case 'delete-email':
        if (!body || !body.emailId) {
          throw new BadRequestException('Email ID is required for deletion.');
        }
        return this.employeeService.deleteEmergencyContactEmailId(
          contactId,
          body.emailId,
        );

      default:
        throw new BadRequestException('Invalid operation type.');
    }
  }
  @Delete('emergency-contacts/:contactId')
  async deleteEmergencyContact(
    @UserDetails() user: any,
    @Param('contactId') contactId: string,
  ) {
    return this.employeeService.deleteEmergencyContact(
      contactId,
      user?.userId?._id,
    );
  }
}
