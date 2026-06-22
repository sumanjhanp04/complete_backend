import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';

import { Client, Company } from '@lib/database';
import { AUTH_SERVICE, USERS_API_MAPS } from '@lib/common';

import {
  ClientDto,
  CompanyDto,
  UpdateClientDto,
  UpdateCompanyDto,
} from '@lib/dto';

/*
|--------------------------------------------------------------------------
| Clients Service
|--------------------------------------------------------------------------
|
| This service contains all business logic related to:
| - Clients
| - Companies
| - RabbitMQ communication with Auth Service
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@Injectable()
export class ClientsService {
  private logger = new Logger(ClientsService.name);

  constructor(
    /*
    |--------------------------------------------------------------------------
    | Client Collection
    |--------------------------------------------------------------------------
    |
    | Injects MongoDB Client Model
    |
    | Collection:
    | clients
    |
    */
    @InjectModel(Client.name)
    private readonly clientsRepository: Model<Client>,

    /*
    |--------------------------------------------------------------------------
    | Company Collection
    |--------------------------------------------------------------------------
    |
    | Injects MongoDB Company Model
    |
    | Collection:
    | companies
    |
    */
    @InjectModel(Company.name)
    private readonly companyRepository: Model<Company>,

    /*
    |--------------------------------------------------------------------------
    | RabbitMQ Client
    |--------------------------------------------------------------------------
    |
    | Used to communicate with Auth Service.
    |
    | Example:
    | Create User
    | Login User
    | Auth Operations
    |
    */
    @Inject(AUTH_SERVICE)
    private readonly authClient: ClientProxy,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Check Existing Client
  |--------------------------------------------------------------------------
  |
  | Checks whether a record already exists.
  |
  | Example:
  |
  | checkIfExists({
  |   email: "abc@gmail.com"
  | })
  |
  |--------------------------------------------------------------------------
  */
  async checkIfExists(prm: object) {
    const paramCheck = await this.clientsRepository.find(prm);

    return paramCheck.length > 0;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Client
  |--------------------------------------------------------------------------
  |
  | Steps:
  |
  | 1. Check Email Exists
  | 2. Check Mobile Exists
  | 3. Create Client
  | 4. Send RabbitMQ Message
  | 5. Create User in Auth Service
  | 6. Rollback if User Creation Fails
  |
  |--------------------------------------------------------------------------
  */
  async createClient(clientDto: ClientDto) {
    /*
    |--------------------------------------------------------------------------
    | Email Validation
    |--------------------------------------------------------------------------
    */
    if (await this.checkIfExists({ email: clientDto.email })) {
      return {
        message: 'Email already exists',
        success: false,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Mobile Validation
    |--------------------------------------------------------------------------
    */
    if (await this.checkIfExists({ mobile: clientDto.mobile })) {
      return {
        message: 'Mobile already exists',
        success: false,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Create Client Record
    |--------------------------------------------------------------------------
    */
    const createdData = await this.clientsRepository.create(clientDto);

    /*
    |--------------------------------------------------------------------------
    | Send Message To Auth Service
    |--------------------------------------------------------------------------
    |
    | RabbitMQ Event:
    | REGISTER_USER
    |
    | Creates login credentials for Client.
    |
    */
    const rUser = await this.authClient
      .send(
        {
          cmd: USERS_API_MAPS.REGISTER_USER,
        },
        {
          userId: createdData?._id,
          userIdRef: 'Client',
          userType: 'Client',

          // Default password = email
          password: createdData?.email,
        },
      )
      .toPromise();

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */
    if (rUser?.success) {
      return {
        message: 'Client Added',
        data: createdData,
        success: true,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Rollback
    |--------------------------------------------------------------------------
    |
    | If User Creation Fails
    | Delete Client Record
    |
    */
    await this.clientsRepository.findByIdAndDelete(createdData?._id);

    return rUser;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Client
  |--------------------------------------------------------------------------
  |
  | Updates client information.
  |
  | Example:
  | updateClient(id,{
  |   image:"profile.jpg"
  | })
  |
  |--------------------------------------------------------------------------
  */
  async updateClient(
    id: string,
    clientData: UpdateClientDto,
  ) {
    return await this.clientsRepository.findByIdAndUpdate(
      id,
      clientData,
      {
        new: true, // Return updated document
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | List Clients
  |--------------------------------------------------------------------------
  |
  | Features:
  | - Search
  | - Pagination
  | - Sorting
  | - Company Populate
  |
  |--------------------------------------------------------------------------
  */
  async listClients(
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    let filter: any = {};

    /*
    |--------------------------------------------------------------------------
    | Search Filter
    |--------------------------------------------------------------------------
    |
    | Search by:
    | - firstName
    | - lastName
    |
    */
    if (keyword) {
      filter = {
        $or: [
          {
            firstName: {
              $regex: keyword,
              $options: 'i',
            },
          },
          {
            lastName: {
              $regex: keyword,
              $options: 'i',
            },
          },
        ],
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Build Query
    |--------------------------------------------------------------------------
    |
    | Populate Company Details
    |
    */
    const query = this.clientsRepository
      .find(filter)
      .populate('company');

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */
    if (sortBy && sortOrder) {
      query.sort({
        [sortBy]: sortOrder === 'desc' ? -1 : 1,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */
    if (page && limit) {
      const skip = (page - 1) * limit;

      query.skip(skip).limit(limit);

      /*
      |--------------------------------------------------------------------------
      | Count Total Records
      |--------------------------------------------------------------------------
      */
      const total =
        await this.clientsRepository.countDocuments(filter);

      const data = await query.exec();

      return {
        data,
        pagination: {
          total,
          count: data.length,
        },
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Return All Clients
    |--------------------------------------------------------------------------
    */
    const data = await query.exec();

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Company
  |--------------------------------------------------------------------------
  */
  async createCompany(companyDto: CompanyDto) {
    const company =
      await this.companyRepository.create(companyDto);

    return company;
  }

  /*
  |--------------------------------------------------------------------------
  | Count Clients
  |--------------------------------------------------------------------------
  */
  async countAllClients() {
    return this.clientsRepository.countDocuments();
  }

  /*
  |--------------------------------------------------------------------------
  | Count Companies
  |--------------------------------------------------------------------------
  */
  async countAllCompanies() {
    return this.companyRepository.countDocuments();
  }

  /*
  |--------------------------------------------------------------------------
  | List Companies
  |--------------------------------------------------------------------------
  |
  | Features:
  | - Search
  | - Pagination
  | - Sorting
  |
  |--------------------------------------------------------------------------
  */
  async listAllCompany(
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const filter: any = {};

    /*
    |--------------------------------------------------------------------------
    | Search By Company Name
    |--------------------------------------------------------------------------
    */
    if (keyword) {
      filter.name = {
        $regex: keyword,
        $options: 'i',
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Build Query
    |--------------------------------------------------------------------------
    */
    const query =
      this.companyRepository.find(filter);

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */
    if (sortBy && sortOrder) {
      query.sort({
        [sortBy]: sortOrder === 'desc' ? -1 : 1,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */
    if (page && limit) {
      const skip = (page - 1) * limit;

      query.skip(skip).limit(limit);

      const total =
        await this.companyRepository.countDocuments(
          filter,
        );

      const data = await query.exec();

      return {
        data,
        pagination: {
          total,
          count: data.length,
        },
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Return All Companies
    |--------------------------------------------------------------------------
    */
    const data = await query.exec();

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Company
  |--------------------------------------------------------------------------
  |
  | Updates Company Information
  |
  |--------------------------------------------------------------------------
  */
  async updateClientCompany(
    id: string,
    data: UpdateCompanyDto,
  ) {
    const company =
      await this.companyRepository.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
        },
      );

    return company;
  }
}