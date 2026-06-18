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

@Injectable()
export class ClientsService {
  private logger = new Logger(ClientsService.name);
  constructor(
    @InjectModel(Client.name)
    private readonly clientsRepository: Model<Client>,
    @InjectModel(Company.name)
    private readonly companyRepository: Model<Company>,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) { }

  async checkIfExists(prm: object) {
    const paramCheck = await this.clientsRepository.find(prm);
    return paramCheck.length > 0;
  }

  async createClient(clientDto: ClientDto) {

    if (await this.checkIfExists({ email: clientDto.email }))
      return { message: 'Email already exists', success: false };
    if (await this.checkIfExists({ mobile: clientDto.mobile }))
      return { message: 'Mobile already exists', success: false };
    const createdData = await this.clientsRepository.create(clientDto);

    const rUser = await this.authClient
      .send(
        { cmd: USERS_API_MAPS.REGISTER_USER },
        {
          userId: createdData?._id,
          userIdRef: 'Client',
          userType: 'Client',
          password: createdData?.email,
        },
      )
      .toPromise();


    if (rUser?.success)
      return { message: 'Client Added', data: createdData, success: true };
    await this.clientsRepository.findByIdAndDelete(createdData?._id);
    return rUser;
  }

  async updateClient(id: string, clientData: UpdateClientDto) {
    return await this.clientsRepository.findByIdAndUpdate(id, clientData, {
      new: true,
    });
  }

  async listClients(
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    let filter: any = {};

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

    const query = this.clientsRepository.find(filter).populate('company');

    // Apply sorting if provided
    if (sortBy && sortOrder) {
      query.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    }

    // Apply pagination if page and limit are provided
    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      // Fetch the total count of documents for pagination purposes
      const total = await this.clientsRepository.countDocuments(filter);

      const data = await query.exec();

      return {
        data,
        pagination: {
          total,
          count: data.length,
        },
      };
    }

    // If no pagination, return all clients
    const data = await query.exec();
    return data;
  }

  async createCompany(companyDto: CompanyDto) {
    const compny = await this.companyRepository.create(companyDto);
    return compny;
  }

  async countAllClients() {
    return this.clientsRepository.countDocuments();
  }

  async countAllCompanies() {
    return this.companyRepository.countDocuments();
  }

  async listAllCompany(
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const filter: any = {};

    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' }; // Example filter by name or any other field
    }

    const query = this.companyRepository.find(filter);

    // Apply sorting if provided
    if (sortBy && sortOrder) {
      query.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    }

    // Apply pagination if page and limit are provided
    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      // Fetch the total count of documents for pagination purposes
      const total = await this.companyRepository.countDocuments(filter);

      const data = await query.exec();

      return {
        data,
        pagination: {
          total,
          count: data.length,
        },
      };
    }

    // If no pagination, return all companies
    const data = await query.exec();
    return data;
  }

  async updateClientCompany(id: string, data: UpdateCompanyDto) {
    const cmpny = await this.companyRepository.findByIdAndUpdate(id, data, {
      new: true,
    });
    return cmpny;
  }
}
