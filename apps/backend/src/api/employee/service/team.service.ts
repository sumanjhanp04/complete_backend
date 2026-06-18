import { getUserPopulationFields } from "@lib/common";
import { Teams } from "@lib/database";
import { CreateTeamDto, ListQueryDTO, UpdateTeamDto } from "@lib/dto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class TeamService {
    constructor(
        @InjectModel(Teams.name) private readonly teamModel: Model<Teams>,
    ) { }


    async getAllTeam(query: ListQueryDTO) {
        const { keyword, page, limit, sort, sortBy } = query;

        // Create a base query object
        const qry: any = {};

        // Add regex search on the `name` field if keyword is provided
        if (keyword) {
            qry.name = { $regex: keyword, $options: 'i' }; // 'i' for case-insensitive search
        }

        // Create a base query
        let queryBuilder = this.teamModel.find(qry);

        // Apply sorting if provided
        if (sort && sortBy) {
            queryBuilder = queryBuilder.sort({ [sortBy]: sort });
        }

        // Check if pagination parameters are provided
        if (page && limit) {
            const skip = (page - 1) * limit;

            // Apply pagination
            const paginatedResult = await queryBuilder.skip(skip).limit(limit)
                .populate(getUserPopulationFields("teamLead members createdBy updatedBy")).exec();
            const totalCount = await this.teamModel.countDocuments(qry);

            // Return paginated result with metadata
            return {
                data: paginatedResult,
                pagination: {
                    total: totalCount,
                    count: paginatedResult.length
                }
            };
        }

        // If no pagination info is provided, return all the data
        return await queryBuilder.populate(getUserPopulationFields("teamLead members createdBy updatedBy")).exec();
    }




    // async getAllTeam(query: ListQueryDTO) {
    //     const { keyword, page, limit, sort, sortBy } = query;
    //     return await this.teamModel.find()
    // }





    async getMyTeam(query: ListQueryDTO, user: string) {
        const { keyword, page, limit, sort, sortBy } = query;

        // Base query: teams where the user is either the team lead or a member
        const qry: any = {
            $or: [
                { teamLead: user },
                { members: { $in: user } }
            ]
        };

        // Add regex search on the `name` field if keyword is provided
        if (keyword) {
            qry.name = { $regex: keyword, $options: 'i' }; // 'i' for case-insensitive search
        }

        // Create a base query
        let queryBuilder = this.teamModel.find(qry);

        // Apply sorting if provided
        if (sort && sortBy) {
            queryBuilder = queryBuilder.sort({ [sortBy]: sort });
        }

        // Check if pagination parameters are provided
        if (page && limit) {
            const skip = (page - 1) * limit;

            // Apply pagination
            const paginatedResult = await queryBuilder.skip(skip).limit(limit)
                .populate(getUserPopulationFields("teamLead members createdBy updatedBy")).exec();
            const totalCount = await this.teamModel.countDocuments(qry); // Total number of documents matching the query

            // Return paginated result with metadata
            return {
                data: paginatedResult,
                pagination: {
                    total: totalCount,
                    count: paginatedResult.length
                },
            };
        }

        // If no pagination info is provided, return all the data
        return await queryBuilder.populate(getUserPopulationFields("teamLead members createdBy updatedBy")).exec();
    }


    // async getMyTeam(query: ListQueryDTO, user: string) {
    //     const { keyword, page, limit, sort, sortBy } = query;
    //     const qry = {
    //         $or: [
    //             { teamLead: user },
    //             { members: { $in: user } }
    //         ]
    //     }
    //     return await this.teamModel.find(qry)
    // }


    async createATeam(teamDto: CreateTeamDto) {
        return await this.teamModel.create(teamDto);
    }

    async updateTeam(id: string, teamDto: UpdateTeamDto) {
        return await this.teamModel.findByIdAndUpdate(id, teamDto);
    }


    async deleteATeam(id: string) {
        return await this.teamModel.findByIdAndDelete(id);
    }
}