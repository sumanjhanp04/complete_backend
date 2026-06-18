import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TeamService } from '../service/team.service';
import { HasAccess, UserDetails } from '@lib/decorators';
import { CreateTeamDto, ListQueryDTO, UpdateTeamDto } from '@lib/dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from '@lib/guards';

@ApiTags("Teams Api")
@Controller('team')
@UseGuards(AccessGuard)
@ApiBearerAuth()
export class TeamsController {
    constructor(
        private readonly teamService: TeamService
    ) { }

    @Get()
    async getAllTeam(@Query() query: ListQueryDTO) {
        return await this.teamService.getAllTeam(query);
    }

    @Get('me')
    async getMyTeam(@Query() query: ListQueryDTO, @UserDetails() user: any) {
        return await this.teamService.getMyTeam(query, user?._id);
    }


    @Post()
    @HasAccess()
    async createATeam(@Body() teamData: CreateTeamDto, @UserDetails() user: any) {
        return await this.teamService.createATeam({ ...teamData, createdBy: user?._id });
    }

    @Put(':id')
    async updateATeam(@Param('id') id: string, @Body() updateData: UpdateTeamDto, @UserDetails() user: any) {
        return await this.teamService.updateTeam(id, { ...updateData, updatedBy: user?._id })
    }


    @Delete(':id')
    @HasAccess()
    async deleteATeam(@Param('id') id: string) {
        return await this.teamService.deleteATeam(id);
    }


}
