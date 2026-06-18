import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Department, Designation, Employee, EMPLOYEE_TYPE_MAP } from '@lib/database';
import { AUTH_SERVICE, USERS_API_MAPS } from '@lib/common';
import {
  AddEmployeeDto,
  // EmployeeAddressDto,
  ListQueryDTO,
  UpdateEmployeeDto,
} from '@lib/dto';
import { RedisService } from 'libs/cache/src';
// import { AddEmergencyContactDto } from '@lib/dto/dtos/employee/emergencyContactInfo.dto';
import { EmergencyContact } from '@lib/database/schemas/employees/emergencyContact.schema';
import { Address } from '@lib/database/schemas/employees/address.schema';
import { AddEmergencyContactDto } from '@lib/dto/dtos/employee/emergencyContactInfo.dto';
import { AddAddressDto } from '@lib/dto/dtos/employee/address.dto';
import { UserDetails } from '@lib/decorators';
// import { AddAddressDto } from '@lib/dto/dtos/employee/address.dto';
@Injectable()
export class EmployeesService {
  private logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly redisService: RedisService,
    @InjectModel(Designation.name)
    private readonly designationModel: Model<Designation>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
    @InjectModel(EmergencyContact.name)
    private readonly emergencyContactModel: Model<EmergencyContact>,
  ) { }

  async checkIfExists(prm: object) {
    const paramCheck = await this.employeeModel.find(prm);
    return paramCheck.length > 0;
  }

  async createEmployee(data: AddEmployeeDto) {
    if (await this.checkIfExists({ email: data.email }))
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    else if (await this.checkIfExists({ mobile: data.mobile }))
      throw new HttpException('Mobile already exists', HttpStatus.BAD_REQUEST);
    else if (await this.checkIfExists({ employeeId: data.employeeId }))
      throw new HttpException(
        'Employee Id already exists',
        HttpStatus.BAD_REQUEST,
      );

    const createdData = await (
      await this.employeeModel.create(data)
    ).populate({ path: 'designation', populate: { path: 'department' } });
    const rUser = await this.authClient
      .send(
        { cmd: USERS_API_MAPS.REGISTER_USER },
        {
          userId: createdData?._id,
          userIdRef: 'Employee',
          userType: 'Employee',
        },
      )
      .toPromise();
    if (rUser?.success) {
      return {
        message: 'Employee Created and Registered Successfully !',
        success: true,
        data: createdData,
      };
    }

    await this.employeeModel.findByIdAndDelete(createdData?._id);
    return rUser;
  }

  // async listEmployee(query: { keyword?: string, page?: number, limit?: number, sort?: string, sortBy?: string }) {
  //     let searchParam = {};
  //     // this.logger.log("Here")

  //     return await this.employeeModel.find(searchParam).populate([
  //         { path: 'designation', populate: { path: 'department' } },
  //         {
  //             path: 'reportsTo',
  //             populate: { path: 'designation', populate: { path: 'department' } },
  //         },
  //     ]);
  // }

  async listEmployee(query: ListQueryDTO, user: any) {
    const { keyword, page, limit, sort, sortBy } = query;
    let searchParam: any = {};

    const isManager = user.isManager;

    // Add search functionality if keyword is provided
    if (keyword) {
      searchParam = {
        $or: [
          { firstName: { $regex: keyword, $options: 'i' } },
          { lastName: { $regex: keyword, $options: 'i' } },
          { mobile: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { employeeId: { $regex: keyword, $options: 'i' } },
        ],
      };
    }

    if (![EMPLOYEE_TYPE_MAP.ADMIN, EMPLOYEE_TYPE_MAP.HR].includes(user.userId.role) && !isManager) {
      searchParam.reportsTo = user._id;
    }

    // Sorting and Pagination
    const sortOptions: { [key: string]: SortOrder } = {
      [sortBy]: sort === 'asc' ? 1 : -1,
    };

    // Create a unique cache key based on the query paraeters
    const cacheKey = `listEmployee:${JSON.stringify({ keyword, page, limit, sort, sortBy })}`;

    // Check cache
    const cachedData = await this.redisService.getFromCache(cacheKey);
    if (typeof cachedData === 'string' && cachedData) {
      this.logger.debug('fetched from cache');
      return JSON.parse(cachedData);
    }

    // Query the database if data is not in cache
    if (page && limit) {
      const total = await this.employeeModel.countDocuments(searchParam);
      const employees = await this.employeeModel
        .find(searchParam)
        .populate([
          { path: 'designation', populate: { path: 'department' } },
          {
            path: 'reportsTo',
            populate: { path: 'designation', populate: { path: 'department' } },
          },
        ])
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const result = {
        data: employees,
        pagination: {
          total,
          count: employees.length,
        },
      };

      // Cache the result with an expiration time (e.g., 1 hour)
      await this.redisService.setInCache(cacheKey, JSON.stringify(result), 300);
      return result;
    } else {
      const employees = await this.employeeModel
        .find(searchParam)
        .populate([
          { path: 'designation', populate: { path: 'department' } },
          {
            path: 'reportsTo',
            populate: { path: 'designation', populate: { path: 'department' } },
          },
        ])
        .sort(sortOptions);

      // Cache the result with an expiration time (e.g., 1 hour)
      await this.redisService.setInCache(
        cacheKey,
        JSON.stringify(employees),
        300,
      );
      return employees;
    }
  }

  async getEmployeeDetails(id: string) {
    try {
      // Create a unique cache key for the employee
      const cacheKey = `employeeDetails:${id}`;

      // Check cache
      const cachedData = await this.redisService.getFromCache(cacheKey);
      if (typeof cachedData === 'string' && cachedData) {
        return JSON.parse(cachedData);
      }

      // Query the database if data is not in cache
      const emp = await this.employeeModel.findById(id).populate([
        { path: 'designation', populate: { path: 'department' } },
        { path: 'emergencyContacts' },
        {
          path: 'reportsTo',
          populate: { path: 'designation', populate: { path: 'department' } },
        },
        { path: 'permanentAddress' }
      ]);

      const result = {
        message: 'Employee Details Fetched',
        success: true,
        data: { basicDetails: emp },
      };

      // Cache the result with an expiration time (e.g., 1 hour)
      await this.redisService.setInCache(cacheKey, JSON.stringify(result), 300);

      return result;
    } catch (err) {
      return { message: "Something isn't right !", success: false, err };
    }
  }

  async updateEmployee(updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const { employeeId, ...data } = updateEmployeeDto;

      const updatedData = await this.employeeModel
        .findOneAndUpdate({ employeeId: employeeId }, data, { new: true })
        .populate([
          { path: 'designation', populate: { path: 'department' } },
          {
            path: 'reportsTo',
            populate: { path: 'designation', populate: { path: 'department' } },
          },
        ]);

      return updatedData;
      // return {
      //   message: 'Employee Updated !',
      //   success: true,
      //   data: updatedData,
      // };
    } catch (err) {
      return { message: "Something isn't right !", success: false, err };
    }
  }

  async addPhoneNumbers(_id: string, phoneNumber: string) {
    // Step 1: Check if the phone number already exists in the alternativePhNos array
    const employee = await this.employeeModel.findById(_id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    // if (employee.alternativePhNos.includes(phoneNumber)) {
    //   throw new Error('Phone Number already exists');
    // }

    // Step 2: If not, add the phone number to the array
    const data = await this.employeeModel.updateOne(
      { _id },
      { $push: { alternativePhNos: phoneNumber } }, // Push single phone number into the array
    );
    return data;
  }

  async addEmailIds(_id: string, emailId: string) {
    // Step 1: Check if the email ID already exists in the alternativeEmailIds array
    const employee = await this.employeeModel.findById(_id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    //  if (employee.alternativeEmailIds.includes(emailId)) {
    //    throw new Error('Email ID already exists');
    //  }

    // Step 2: If not, add the email ID to the array
    const data = await this.employeeModel.updateOne(
      { _id },
      { $push: { alternativeEmailIds: emailId } }, // Push single email ID into the array
    );
    // await data.save();
    return data;
  }
  async postAddress(id: string, dto: AddAddressDto) {
    const address = await this.addressModel.create(dto);
    const emp = await this.employeeModel.findByIdAndUpdate(
      { _id: id },
      {
        permanentAddress: address?._id,
      },
      { new: true },
    );
  }
  async addEmergencyContact(employeeId: string, dto: AddEmergencyContactDto) {
    if (!dto.permanentAddress) {

    }

    // Step 1: Handle the sameAsPermanentAddress logic
    if (dto.sameAsPermanentAddress) {
      dto.currentAddress = dto.permanentAddress; // If the address is the same, assign currentAddress to permanentAddress
    }

    // Step 2: Save the permanentAddress to the Address collection
    const savedPermanentAddress = await this.addressModel.create({
      ...dto.permanentAddress, // Assuming dto.permanentAddress is an object with the address details
    });

    let savedCurrentAddress = null;
    // If currentAddress is provided and it's not the same as permanentAddress, save it as a separate address
    if (dto.currentAddress && dto.currentAddress !== dto.permanentAddress) {
      savedCurrentAddress = await this.addressModel.create({
        ...dto.currentAddress, // Assuming dto.currentAddress is an object with the address details
      });
    }

    // Step 3: Update the addresses in the DTO before saving the emergency contact
    const dtoPermanentAddress = savedPermanentAddress._id; // Assign the saved ObjectId to permanentAddress
    let dtoCurrentAddress = null;
    if (savedCurrentAddress) {
      dtoCurrentAddress = savedCurrentAddress._id; // Assign the saved ObjectId to currentAddress if it's different
    } else if (dto.sameAsPermanentAddress) {
      dtoCurrentAddress = savedPermanentAddress._id; // If currentAddress is the same as permanentAddress, assign the same ObjectId
    }

    // Ensure uniqueness of secondaryMobile and secondaryEmail
    const uniqueSecondaryMobiles = Array.from(new Set(dto.secondaryMobile));
    const uniqueSecondaryEmails = Array.from(new Set(dto.secondaryEmail));

    // Step 4: Create the emergency contact document
    const newEmergencyContact = new this.emergencyContactModel({
      name: dto.name,
      relation: dto.relation,
      primaryMobile: dto.primaryMobile,
      secondaryMobile: uniqueSecondaryMobiles, // Use unique secondary mobiles
      primaryEmail: dto.primaryEmail,
      secondaryEmail: uniqueSecondaryEmails, // Use unique secondary emails
      permanentAddress: dtoPermanentAddress,
      currentAddress: dtoCurrentAddress,
      sameAsPermanentAddress: dto.sameAsPermanentAddress,
    });

    const savedEmergencyContact = await newEmergencyContact.save();

    // Step 5: Find the employee by ID
    const employee = await this.employeeModel.findById(employeeId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Step 6: Push the new emergency contact's ID into the employee's emergencyContacts array
    employee.emergencyContacts.push(savedEmergencyContact._id as any);

    // Step 7: Save the updated employee document
    await employee.save();

    const populatedEmergencyContact = await this.emergencyContactModel
      .findById(savedEmergencyContact._id)
      .populate('permanentAddress')
      .populate('currentAddress');

    // Return the populated emergency contact
    return populatedEmergencyContact;
  }

  async getEmployeeContactInfo(employeeId: string) {
    return this.employeeModel
      .findById(employeeId)
      .populate('permanentAddress')
      .populate('currentAddress')
      .populate({
        path: 'emergencyContacts', // First populate the emergencyContacts field
        populate: [
          { path: 'permanentAddress' }, // Then populate permanentAddress within emergencyContacts
          { path: 'currentAddress' }, // And populate currentAddress within emergencyContacts
        ],
      })
      .exec();
  }

  async updateEmergencyContact(contactId: string, dto: any) {
    // Step 1: Fetch the existing contact
    const existingContact: any = await this.emergencyContactModel
      .findById(contactId)
      .populate('permanentAddress')
      .populate('currentAddress');

    if (!existingContact) {
      throw new Error('Emergency contact not found');
    }

    // Step 2: Handle the `sameAsPermanentAddress` logic
    if (dto.sameAsPermanentAddress) {
      dto.currentAddress = dto.permanentAddress; // Assign `currentAddress` to `permanentAddress` if the flag is true
    }

    // Step 3: Update the `permanentAddress` if provided
    if (dto.permanentAddress) {
      const updatedPermanentAddress = await this.addressModel.findByIdAndUpdate(
        existingContact.permanentAddress?._id,
        { ...dto.permanentAddress },
        { new: true },
      );
      existingContact.permanentAddress = updatedPermanentAddress._id as any;
    }

    // Step 4: Update the `currentAddress` if provided and not the same as `permanentAddress`
    if (dto.currentAddress && dto.currentAddress !== dto.permanentAddress) {
      if (existingContact.currentAddress) {
        const updatedCurrentAddress = await this.addressModel.findByIdAndUpdate(
          existingContact.currentAddress?._id,
          { ...dto.currentAddress },
          { new: true },
        );
        existingContact.currentAddress = updatedCurrentAddress._id as any;
      } else {
        const newCurrentAddress = await this.addressModel.create({
          ...dto.currentAddress,
        });
        existingContact.currentAddress = newCurrentAddress._id as any;
      }
    } else if (dto.sameAsPermanentAddress) {
      existingContact.currentAddress = existingContact.permanentAddress._id;
    }

    // Step 5: Update the emergency contact document with new details
    existingContact.name = dto.name || existingContact.name;
    existingContact.relation = dto.relation || existingContact.relation;
    existingContact.primaryMobile =
      dto.primaryMobile || existingContact.primaryMobile;
    existingContact.secondaryMobile =
      dto.secondaryMobile || existingContact.secondaryMobile;
    existingContact.primaryEmail =
      dto.primaryEmail || existingContact.primaryEmail;
    existingContact.secondaryEmail =
      dto.secondaryEmail || existingContact.secondaryEmail;
    existingContact.sameAsPermanentAddress =
      dto.sameAsPermanentAddress || existingContact.sameAsPermanentAddress;

    const updatedEmergencyContact = await existingContact.save();

    // Step 6: Return the updated emergency contact with populated addresses
    const populatedEmergencyContact = await this.emergencyContactModel
      .findById(updatedEmergencyContact._id)
      .populate('permanentAddress')
      .populate('currentAddress');

    return populatedEmergencyContact;
  }
  async deleteEmployee(id: string) {
    try {
      const d = await this.authClient
        .send({ cmd: USERS_API_MAPS.DELETE_USER }, { id })
        .toPromise();
      if (d?.success) {
        const dlt = await this.employeeModel.findByIdAndDelete(id);
        return { message: 'Employee Deleted !', success: true, data: dlt };
      }
      return d;
    } catch (err) {
      return { message: "Something isn't right !", success: false, err };
    }
  }
  async deletePhoneNumber(_id: string, phoneNumber: string) {
    const employee = await this.employeeModel.findById(_id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Remove the phone number from the alternativePhNos array
    const updatedEmployee = await this.employeeModel.updateOne(
      { _id },
      { $pull: { alternativePhNos: phoneNumber } },
    );

    // Check if the phone number was found and removed
    if (updatedEmployee.modifiedCount === 0) {
      throw new Error('Phone number not found');
    }

    return { message: 'Phone number deleted successfully' };
  }
  async deleteEmailId(_id: string, emailId: string) {
    const employee = await this.employeeModel.findById(_id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Remove the email ID from the alternativeEmailIds array
    const updatedEmployee = await this.employeeModel.updateOne(
      { _id },
      { $pull: { alternativeEmailIds: emailId } },
    );

    // Check if the email ID was found and removed
    if (updatedEmployee.modifiedCount === 0) {
      throw new Error('Email ID not found');
    }

    return { message: 'Email ID deleted successfully' };
  }
  async deleteEmergencyContactPhoneNumber(contactId: string, phNo: string) {
    // Step 1: Find the emergency contact by ID
    const existingContact = await this.emergencyContactModel
      .findById(contactId)
      .populate('permanentAddress')
      .populate('currentAddress');

    if (!existingContact) {
      throw new Error('Emergency contact not found');
    }

    // Step 2: Check if the phone number exists in the emergency contact
    const phoneIndex = existingContact.secondaryMobile.findIndex(
      (phone) => phone === phNo,
    );
    if (phoneIndex === -1) {
      throw new Error('Phone number not found');
    }

    // Step 3: Delete the phone number from the array
    existingContact.secondaryMobile.splice(phoneIndex, 1);

    // Step 4: Save the updated emergency contact document
    const updatedContact = await existingContact.save();

    // Step 5: Return the updated emergency contact with populated addresses
    const populatedUpdatedContact = await this.emergencyContactModel
      .findById(updatedContact._id)
      .populate('permanentAddress')
      .populate('currentAddress');

    return populatedUpdatedContact;
  }

  async deleteEmergencyContactEmailId(contactId: string, emailId: string) {
    // Step 1: Find the emergency contact by ID
    const existingContact = await this.emergencyContactModel
      .findById(contactId)
      .populate('permanentAddress')
      .populate('currentAddress');

    if (!existingContact) {
      throw new Error('Emergency contact not found');
    }

    // Step 2: Check if the email ID exists in the emergency contact
    const emailIndex = existingContact.secondaryEmail.findIndex(
      (email) => email === emailId,
    );
    if (emailIndex === -1) {
      throw new Error('Email ID not found');
    }

    // Step 3: Delete the email ID from the array
    existingContact.secondaryEmail.splice(emailIndex, 1);

    // Step 4: Save the updated emergency contact document
    const updatedContact = await existingContact.save();

    // Step 5: Return the updated emergency contact with populated addresses
    const populatedUpdatedContact = await this.emergencyContactModel
      .findById(updatedContact._id)
      .populate('permanentAddress')
      .populate('currentAddress');

    return populatedUpdatedContact;
  }
  async deleteEmergencyContact(id: string, userId: string) {
    // Step 1: Delete the emergency contact document from the emergencyContactModel
    const deletedContact =
      await this.emergencyContactModel.findByIdAndDelete(id);

    if (!deletedContact) {
      throw new Error(`Emergency contact with id ${id} not found`);
    }

    // Step 2: Remove the emergency contact ID from the employeeModel's array
    await this.employeeModel.updateOne(
      { _id: userId }, // Find the employee by userId
      { $pull: { emergencyContacts: id } }, // Remove the contact ID from the emergencyContacts array
    );

    return {
      message: `Emergency contact with id ${id} has been deleted successfully.`,
    };
  }
}
