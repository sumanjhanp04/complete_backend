import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Res,
  Param,
} from '@nestjs/common';
import { CreateProjectHistoryDto } from '@lib/dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsHistoryService } from '../services/project-history.service';
@ApiTags('ProjectHistoryApi')
@Controller('projects-history')
@ApiBearerAuth()
export class ProjectsHistoryController {
  constructor(private readonly projectHistoryService: ProjectsHistoryService) {}

  @Post()
  async createHistory(
    @Body() createProjectHistoryDto: CreateProjectHistoryDto,
  ) {
    const data = await this.projectHistoryService.createHistory(
      createProjectHistoryDto,
    );
    return data;
  }
}
