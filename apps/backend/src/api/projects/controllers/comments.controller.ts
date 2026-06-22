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

/*
|--------------------------------------------------------------------------
| Comments Controller
|--------------------------------------------------------------------------
|
| This controller manages Task Comments.
|
| Responsibilities:
| - Create Comment
| - Get All Comments for a Task
| - Delete Comment
|
| Controller -> Service -> Database
|
|--------------------------------------------------------------------------
*/

@ApiTags('Comments Api') // Swagger API Group Name
@Controller('task-comments') // Base Route => /task-comments
@ApiBearerAuth() // Enables JWT Authentication in Swagger
export class CommentsController {
  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  |
  | Inject CommentsService to handle business logic.
  |
  |--------------------------------------------------------------------------
  */
  constructor(
    private readonly commentService: CommentsService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Create Comment
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | POST /task-comments
  |
  | Purpose:
  | Creates a new comment for a task.
  |
  |--------------------------------------------------------------------------
  */
  @Post()
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @UserDetails() user: any,
  ) {
    /*
    |--------------------------------------------------------------------------
    | Add Logged-in User as Comment Creator
    |--------------------------------------------------------------------------
    */
    const data = await this.commentService.createComment({
      ...createCommentDto,
      createdBy: user._id,
    });

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Get All Comments
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | GET /task-comments?taskId=<taskId>
  |
  | Example:
  | GET /task-comments?taskId=685abc123
  |
  | Purpose:
  | Fetch all comments belonging to a task.
  |
  |--------------------------------------------------------------------------
  */
  @Get()
  async listAllComments(
    @Query('taskId') taskId: string,
    @UserDetails() user: any,
  ) {
    // Retrieve all comments for the specified task
    const data = await this.commentService.listAllComments(
      taskId,
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | Future APIs (Currently Commented)
  |--------------------------------------------------------------------------
  |
  | GET /task-comments/:id
  |      -> Get Comment By ID
  |
  | PUT /task-comments/:id
  |      -> Update Existing Comment
  |
  | These APIs may be implemented later.
  |
  |--------------------------------------------------------------------------
  */

  // @Get(':id')
  // async getCommentById(
  //   @Param('id') id: string,
  //   @UserDetails() user: any,
  // ) {
  //   const data = await this.commentsClient.send(
  //     { cmd: COMMENTS_API_MAPS.GET_COMMENT },
  //     id,
  //   ).toPromise();
  //
  //   return data;
  // }

  // @Put(':id')
  // async updateComment(
  //   @Param('id') id: string,
  //   @Body() updateCommentDto: UpdateCommentDto,
  //   @UserDetails() user: any,
  // ) {
  //   const updateData = {
  //     id,
  //     updateDto: updateCommentDto,
  //   };
  //
  //   const data = await this.commentsClient.send(
  //     { cmd: COMMENTS_API_MAPS.UPDATE_COMMENTS },
  //     updateData,
  //   ).toPromise();
  //
  //   return data;
  // }

  /*
  |--------------------------------------------------------------------------
  | Delete Comment
  |--------------------------------------------------------------------------
  |
  | Endpoint:
  | DELETE /task-comments/:id
  |
  | Example:
  | DELETE /task-comments/685xyz123
  |
  | Purpose:
  | Deletes a comment.
  |
  | Security:
  | Usually only the creator/admin can delete.
  |
  |--------------------------------------------------------------------------
  */
  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @UserDetails() user: any,
  ) {
    // Delete comment using comment ID and user ID
    return await this.commentService.deleteComment(
      id,
      user?._id,
    );
  }
}