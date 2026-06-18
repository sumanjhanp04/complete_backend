import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SubTasksService } from '../services/subtask.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from '@lib/dto';
import { UserDetails } from '@lib/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags("Subtasks")
@Controller('subtask')
@ApiBearerAuth()
export class SubtaskController {
    constructor(private readonly subtaskService: SubTasksService) { }


    @Post()
    async createSubtask(@Body() subtaskDto: CreateSubtaskDto, @UserDetails() user: any) {
        return await this.subtaskService.createSubtask({ ...subtaskDto, createdBy: user?._id })
    }

    @Get()
    async getSubtasks(@Query() query: { task: string, user: string }, @UserDetails() user: any) {
        return await this.subtaskService.getAllSubtasks(query);
    }


    @Put(":id")
    async updateSubtask(@Param("id") id: string, @Body() subtaskDto: UpdateSubtaskDto, @UserDetails() user: any) {
        return await this.subtaskService.updateSubtasks(id, { ...subtaskDto, updatedBy: user?._id });
    }


    @Delete(":id")
    async deleteSubtask(@Param("id") id: string) {
        return await this.subtaskService.deleteSubtasks(id);
    }
}