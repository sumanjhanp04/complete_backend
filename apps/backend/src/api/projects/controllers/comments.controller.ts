import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from '../services/comments.service';
import { UserDetails } from '@lib/decorators';
import { CreateCommentDto } from '@lib/dto';


@ApiTags('Comments Api')
@Controller('task-comments')
@ApiBearerAuth()
export class CommentsController {
  constructor(
    private readonly commentService: CommentsService
  ) { }

  @Post()
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @UserDetails() user: any
  ) {
    const data = await this.commentService.createComment({ ...createCommentDto, createdBy: user._id })
    return data;
  }


  @Get()
  async listAllComments(
    @Query('taskId') taskId: string,
    @UserDetails() user: any
  ) {
    const data = await this.commentService.listAllComments(taskId);
    return data;
  }


  // @Get(':id')
  // async getCommentById(@Param('id') id: string, @UserDetails() user:any) {
  //     const data = await this.commentsClient.send({ cmd: COMMENTS_API_MAPS.GET_COMMENT }, id).toPromise();
  //     return data;
  // }

  // @Put(':id')
  // async updateComment(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto, @UserDetails() user:any) {
  //     const updateData = { id, updateDto: updateCommentDto };
  //     const data = await this.commentsClient.send({ cmd: COMMENTS_API_MAPS.UPDATE_COMMENTS }, updateData).toPromise();
  //     return data;
  // }

  @Delete(':id')
  async deleteComment(@Param('id') id: string, @UserDetails() user: any) {
    return await this.commentService.deleteComment(id, user?._id);
  }



}
