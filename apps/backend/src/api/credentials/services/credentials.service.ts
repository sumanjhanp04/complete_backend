import {
  AccountCredentials,
  AccountCredentialsDocument,
} from '@lib/database/schemas/credentials/account-credentials.schema';
import {
  Credentials,
  CredentialsDocument,
} from '@lib/database/schemas/credentials/credentials.schema';
import { CreateCredentialsDto } from '@lib/dto/dtos/credentials/create-credential.dto';
import { UpdateCredentialsDto } from '@lib/dto/dtos/credentials/update-credentials.dto';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AESEncryptionService } from '@lib/common/encrypt/src/services/AESEncryption.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountCredentialsService } from './account-credentials.service';
import { ListQueryDTO } from '@lib/dto';
import { RedisService } from 'libs/cache/src';
import { ObjectId } from 'mongodb';


@Injectable()
export class CredentialsService {
  constructor(
    @InjectModel(Credentials.name)
    private credentialsModel: Model<CredentialsDocument>,
    @InjectModel(AccountCredentials.name)
    private accountModel: Model<AccountCredentialsDocument>,
    private accountCredentialsService: AccountCredentialsService,
    private readonly redisService: RedisService,

  ) { }

  private logger = new Logger('CredentialsService');

  async create(createDto: CreateCredentialsDto, userId: string) {
    const dataModel = await this.credentialsModel.create({
      ...createDto,
      createdBy: userId,
    });
    return dataModel;
  }

  async findAll(
    userId: string,
    searchType: string,
    { page = 1, limit = 10, sort, sortBy, keyword }: ListQueryDTO,
  ) {

    const pipeline = [];

    pipeline.push({
      $lookup: {
        from: 'accountcredentials',
        localField: 'accountCredentials',
        foreignField: '_id',
        as: 'accountCredentials',
      },
    });
    pipeline.push({
      $unwind: {
        path: '$accountCredentials',
        preserveNullAndEmptyArrays: true,
      },
    });


    // const perPage = limit;
    // let query: any = {};

    // // Define query based on search type
    switch (searchType) {
      case 'createdByMe':
        pipeline.push({
          $match: {
            createdBy: new ObjectId(userId),
          },
        });
        break;
      case 'sharedWithMe':
        pipeline.push({
          $match: {
            $or: [
              {
                'accountCredentials.sharedWith.userId': new ObjectId(userId),
              },
              {
                'sharedWith.userId': new ObjectId(userId),
              }
            ],
          },
        })
        break;
      case 'all':
      default:
        pipeline.push({
          $match: {
            $or: [
              {
                createdBy: new ObjectId(userId),
              },
              {
                'sharedWith.userId': new ObjectId(userId),

              },
              {
                'accountCredentials.sharedWith.userId': new ObjectId(userId),
              }
            ],
          },
        });
        break;
    }

    pipeline.push({
      $group: {
        _id: '$_id',
        name: { $first: '$name' },
        description: { $first: '$description' },
        url: { $first: '$url' },
        createdBy: { $first: '$createdBy' },
        createdAt: { $first: '$createdAt' },
        sharedWith: { $first: '$sharedWith' },
        accountCredentials: { $push: '$accountCredentials' },
      },
    });

    pipeline.push({
      $addFields: {
        accountsCount: { $size: '$accountCredentials' },
      },
    });

    if (sortBy && sort) {
      const sortOrder = sort === 'asc' ? 1 : -1;
      pipeline.push({
        $sort: { [sortBy]: sortOrder },
      });
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      pipeline.push({
        $skip: skip,
      });
      pipeline.push({
        $limit: limit,
      });
    }

    const data = await this.credentialsModel.aggregate(pipeline).exec();


    const total = await this.credentialsModel
      .countDocuments({
        $or: [
          { createdBy: new ObjectId(userId) },
          { 'sharedWith.userId': new ObjectId(userId) },
          { 'accountCredentials.sharedWith.userId': new ObjectId(userId) },
        ],
        ...(keyword && { title: { $regex: keyword, $options: 'i' } }),
      })
      .exec();


    const populatedData = await this.credentialsModel.populate(data, [
      {
        path: 'createdBy',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
      {
        path: 'sharedWith.userId',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
    ]);


    const result = {
      data: populatedData,
      pagination: {
        total,
        count: data.length,
      },
    };
    return result;
  }

  async findOne(id: string, userId: string) {
    // Fetch the Credentials document only if the user is in sharedWith
    const credential = await this.credentialsModel
      .findById(id)
      .populate([
        { path: 'sharedWith' },
        {
          path: 'accountCredentials',
        },
      ])
      .lean();

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Check if the user has access
    const hasAccess =
      credential.sharedWith.find(
        (shared) =>
          shared.userId && shared.userId.toString() === userId.toString(),
      ) ||
      credential.createdBy.toString() === userId.toString() ||
      (credential.accountCredentials as unknown as AccountCredentials[]).some((account) =>
        account.sharedWith.some(
          (shared) =>
            shared.userId.toString() === userId.toString(),
        ),
      );

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    const pipeline = [
      {
        $match: {
          credentialsId: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'credentials',
          localField: 'credentialsId',
          foreignField: '_id',
          as: 'credentials',
        },
      },
      {
        $match: {
          $or: [
            {
              'credentials.createdBy': new ObjectId(userId),
            },
            {
              'credentials.sharedWith.userId': new ObjectId(userId),
            },
            {
              'sharedWith.userId': new ObjectId(userId),
            }
          ],
        },
      },
    ];

    const accountsData = await this.accountModel.aggregate(pipeline).exec();

    let accModel = await this.accountModel.populate(accountsData, [
      {
        path: 'createdBy',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
      {
        path: 'sharedWith.userId',
        populate: [
          {
            path: 'userId',
          },
        ],
      },
    ]);

    // console.log(accModel)
    accModel = accModel.map((account) => {
      account.password = this.accountCredentialsService.AESDecrypt(
        account.password,
      );
      account.username = this.accountCredentialsService.AESDecrypt(
        account.username,
      );

      return account;
    });

    // Exclude accountCredentials from the credential object
    const { accountCredentials, ...filteredCredential } = credential;
    return {
      credential: filteredCredential,
      accounts: accModel,
    };
  }

  async update(id: string, updateDto: UpdateCredentialsDto, userId: string) {
    const credential = await this.credentialsModel.findById(id).exec();

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Ensure userId is defined before calling toString
    if (!userId) {
      throw new Error('UserId is undefined');
    }

    const sharedWithUser = credential.sharedWith.find(
      (shared) =>
        shared.userId &&
        shared.userId.toString() === userId.toString() &&
        shared.accessLevel === 'write',
    );

    if (
      !sharedWithUser &&
      credential.createdBy.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Access denied');
    }

    const updatedData = { ...updateDto };
    // Initialize sharedWith array if it doesn't exist
    if (!updatedData.sharedWith) {
      updatedData.sharedWith = [];
    }

    // Update the credential document with the new data
    const updatedCredential = await this.credentialsModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true },
    );

    if (!updatedCredential) {
      throw new Error('Update failed');
    }

    return updatedCredential;
  }

  async remove(id: string, userId: string) {
    // Find the credential by ID
    const credential = await this.credentialsModel.findById(id).lean();

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.createdBy.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }

    // Delete all account credentials linked to this credential
    await this.accountModel.deleteMany({ credentialsId: id });

    // Delete the credential itself
    return this.credentialsModel.findByIdAndDelete(id);
  }

  async findCredentialsSharedWithUser(userId: string): Promise<any> {
    // Find credentials that are shared with the user
    const credentials = await this.credentialsModel
      .find({ 'sharedWith.userId': userId })
      .lean(); // Use lean() for better performance if you don't need Mongoose document methods

    const accountCreds = [];

    // Iterate over each credential and group credentials with their associated accounts
    for (const credential of credentials) {
      const groupedData = [];
      const accounts = [];

      // Add the credential to the grouped data
      groupedData.push({ credential });

      // Loop through each account credential linked to this credential
      for (const account of credential.accountCredentials) {
        // Find the account model based on the account credential ID
        const accModel = await this.accountModel.findById(account);
        if (accModel) {
          // Decrypt the account credentials using RSA
          accModel.password = this.accountCredentialsService.AESDecrypt(
            accModel.password,
          );
          accModel.username = this.accountCredentialsService.AESDecrypt(
            accModel.username,
          );

          // Add the decrypted account to the accounts array
          accounts.push(accModel);
        }
      }

      // Add the accounts array to the grouped data
      groupedData.push({ accounts });

      // Add the grouped data to the accountCreds array
      accountCreds.push(groupedData);
    }

    return { accountCreds };
  }
}
