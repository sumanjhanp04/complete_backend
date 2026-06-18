import {
  AccountCredentials,
  AccountCredentialsDocument,
} from '@lib/database/schemas/credentials/account-credentials.schema';
import { CreateAccountCredentialsDto } from '@lib/dto/dtos/credentials/create-account-credential.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Credentials,
  CredentialsDocument,
} from '@lib/database/schemas/credentials/credentials.schema';
import { AESEncryptionService } from '@lib/common/encrypt/src/services/AESEncryption.service';
import { UpdateAccountCredentialsDto } from '@lib/dto/dtos/credentials/update-account-credential.dto';

import { ListQueryDTO } from '@lib/dto';
@Injectable()
export class AccountCredentialsService {
  constructor(
    @InjectModel(Credentials.name)
    private credentialsModel: Model<CredentialsDocument>,
    @InjectModel(AccountCredentials.name)
    private accountModel: Model<AccountCredentialsDocument>,
    private aesEncryptService: AESEncryptionService, // AES Encryption Service
  ) { }

  async create(createDto: CreateAccountCredentialsDto, userId: string) {
    // Encrypt the password using AES before saving
    createDto.password = this.AESEncrypt(createDto.password.toString());
    createDto.username = this.AESEncrypt(createDto.username.toString());
    // Create the account
    const createdAccount = await this.accountModel.create({
      ...createDto,
      createdBy: userId,
    });

    // Link account with credentials
    const credential = await this.credentialsModel.findById(
      createdAccount.credentialsId,
    );

    credential.accountCredentials.push(createdAccount?._id.toString());
    await credential.save();

    // Populate the credentialId field in the created account
    const populatedAccount = await this.accountModel
      .findById(createdAccount._id)
      .populate({
        path: 'credentialsId',
        select: '-accountCredentials',
      })
      .exec();

    return {
      ...populatedAccount.toObject(),
      username: this.AESDecrypt(createdAccount.username),
      password: this.AESDecrypt(createdAccount.password),
    };
  }

  async findAll(
    userId: string,
    searchType: string,
    { page = 1, limit = 10, sort, sortBy, keyword }: ListQueryDTO,
  ) {
    const perPage = limit || 10; // Default to 10 items per page
    const currentPage = page || 1; // Default to page 1
    const sortOrder = sort === 'desc' ? -1 : 1; // Determine sort order
    const sortField = sortBy || '_id'; // Default sort by `_id`

    let query: any = {};

    // Determine query based on search type
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

    // Add keyword-based search to the query
    if (keyword) {
      query.$or = [
        ...(query.$or || []), // Include existing `$or` conditions
        { 'credentialsId.name': { $regex: keyword, $options: 'i' } }, // Search by name
      ];
    }

    // Fetch account credentials with pagination and sorting
    const accounts = await this.accountModel
      .find(query)
      .select('-username -password') // Exclude 'username' and 'password' fields
      .populate({
        path: 'credentialsId',
        select: '-accountCredentials', // Exclude 'accountCredentials' field
      })
      .sort({ [sortField]: sortOrder }) // Apply sorting
      .skip((currentPage - 1) * perPage) // Apply pagination
      .limit(perPage)
      .exec();

    const totalEntries = await this.accountModel.countDocuments(query).exec(); // Total matching documents
    const currentPageEntries = accounts.length;

    // return {
    //   totalItems: totalCount,
    //   totalPages: Math.ceil(totalCount / perPage),
    //   currentPage,
    //   accounts,
    // };
    return {
      data: accounts,
      pagination: {
        total: totalEntries,
        count: currentPageEntries,
      },
    };
  }

  async update(
    id: string,
    updateDto: UpdateAccountCredentialsDto,
    userId: string,
  ) {
    const account = await this.accountModel.findById(id).exec();

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check authorization
    const isCreator = account.createdBy.toString() === userId.toString();
    const hasWriteAccess = account.sharedWith?.some(
      (shared) =>
        shared.userId.toString() === userId.toString() && shared.accessLevel === 'write',
    );

    if (!isCreator && !hasWriteAccess) {
      throw new ForbiddenException(
        'You are not authorized to update this account',
      );
    }

    // Create update object with only the fields that are provided
    const updateData: Partial<AccountCredentials> = {};

    // Only update username if provided, and encrypt it
    if (updateDto.username) {
      updateData.username = this.AESEncrypt(updateDto.username);
    }

    if (updateDto.password) {
      updateData.password = this.AESEncrypt(updateDto.password);
    }

    // Only update sharedWith if provided
    if (updateDto.sharedWith) {
      updateData.sharedWith = updateDto.sharedWith;
    }
    if (updateDto.note) {
      updateData.note = updateDto.note;
    }


    // Update the account with new data
    const updatedAccount = await this.accountModel
      .findByIdAndUpdate(
        id,
        {
          username: updateData.username,
          password: updateData.password,
          note: updateData.note,
          sharedWith: updateData.sharedWith
        },
        { new: true }, // Return the updated document
      )
      .populate('sharedWith.userId')
      .exec();

    if (!updatedAccount) {
      throw new NotFoundException('Failed to update account');
    }

    // Return the updated account with decrypted username
    return {
      ...updatedAccount.toObject(),
      username: this.AESDecrypt(updatedAccount.username),
      password: this.AESDecrypt(updatedAccount.password),
    };
  }


  async findOne(id: string, userId: string) {
    const account = await this.accountModel
      .findById(id)
      .populate({
        path: 'credentialsId',
        select: '-accountCredentials',
      })
      .exec();

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (
      !account.sharedWith.some((shared) => shared.userId.toString() === userId.toString())
      && account.createdBy.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Access denied');
    }
    // Returning similar structure to findAll method
    return {
      ...account.toObject(),
      username: this.AESDecrypt(account.username),
      password: this.AESDecrypt(account.password),
    }
  }

  async remove(id: string, userId: string) {
    const account = await this.accountModel.findByIdAndDelete(id);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.createdBy.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }
    return {
      success: true,
      message: "Account Credential deleted successfully"
    }
  }

  AESDecrypt(password: string) {
    const data = this.aesEncryptService.decrypt(password);

    return data;
    // return this.rsaEncryptService.encryptWithPrivateKey(data);
  }

  AESEncrypt(password: string) {
    return this.aesEncryptService.encrypt(password);
  }
}
