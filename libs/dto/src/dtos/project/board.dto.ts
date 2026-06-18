import { TASK_PRIORITY } from '@lib/database';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsArray, IsNumber, ValidateNested, IsBoolean, IsEnum } from 'class-validator';

// DTO for creating a board
export class CreateBoardDto {
  @ApiProperty({
    description: 'The name of the board',
    example: 'Project Management',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'A brief description of the board',
    example: 'Board for managing project tasks and assignments',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The unique identifier of the admin responsible for the board',
    example: '605c72ef7c1b2c001f64f4f3',
  })
  @IsMongoId()
  admin: string;

  @ApiPropertyOptional({
    description: 'List of user IDs assigned to the board',
    example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedUser?: string[];

  @ApiPropertyOptional({
    description: 'List of column IDs associated with the board',
    example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  columns?: string[];

  @ApiProperty({
    description:
      'The unique identifier of the project to which the board belongs',
    example: '605c72ef7c1b2c001f64f4f4',
  })
  @IsMongoId()
  project: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who created the board',
    example: '605c72ef7c1b2c001f64f4f5',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

// DTO for updating a board
export class UpdateBoardDto {
  @ApiPropertyOptional({
    description: 'The name of the board',
    example: 'Updated Project Management',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'A brief description of the board',
    example: 'Updated description for board',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the admin responsible for the board',
    example: '605c72ef7c1b2c001f64f4f3',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  admin?: string;

  @ApiPropertyOptional({
    description: 'List of user IDs assigned to the board',
    example: ['605c72ef7c1b2c001f64f4f3'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedUser?: string[];

  @ApiPropertyOptional({
    description: 'List of column IDs associated with the board',
    example: ['605c72ef7c1b2c001f64f4f4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  columns?: string[];

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who updated the board',
    example: '605c72ef7c1b2c001f64f4f5',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;


}

// DTO for creating a column
export class CreateColumnDto {
  @ApiProperty({
    description: 'The name of the column',
    example: 'To Do',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'A brief description of the column',
    example: 'Tasks that are yet to be started',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of task IDs associated with the column',
    example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  tasks?: string[];

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who created the column',
    example: '605c72ef7c1b2c001f64f4f5',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

// DTO for updating a column
export class UpdateColumnDto {
  @ApiPropertyOptional({
    description: 'The name of the column',
    example: 'In Progress',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'A brief description of the column',
    example: 'Tasks that are currently being worked on',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The color associated with the column',
    example: '#FFC300',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who updated the column',
    example: '605c72ef7c1b2c001f64f4f5',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsString()
  colTo?: string;

  @IsOptional()
  @IsString()
  colFrom?: string;
}

export class DeleteColumnDto{
  @ApiPropertyOptional({
    description: 'must be the border Id',
    example: '68074ab9b213dfc9725df649',
  })
  @IsString()
  board?: string;
}

// DTO for creating a task

export class SubtaskDto {
    @ApiProperty({
        description: 'The name of the task',
        example: 'create your canvas',
    })
    title: string;

    @ApiPropertyOptional({
        description: 'The name of the task',
        example: 'user abc',
    })
    assignedTo?: string;

    @ApiProperty({
        description: 'The status of the subtask',
        example: false,
    })
    isCompleted?: boolean;
}
export class CreateTaskDto {
  @ApiProperty({
    description: 'The name of the task',
    example: 'Design Homepage',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the task',
    example: 'Create and design the homepage layout for the new website',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of user IDs assigned to the task',
    example: ['605c72ef7c1b2c001f64f4f6', '605c72ef7c1b2c001f64f4f7'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUser?: string[];

  @ApiPropertyOptional({
    description: 'The estimated duration of the task in hours',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who created the task',
    example: '605c72ef7c1b2c001f64f4f5',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the user who last updated the task',
    example: '605c72ef7c1b2c001f64f4f6',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

// DTO for updating a task
export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'The name of the task',
    example: 'Update Homepage Design',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the task',
    example: 'Update the design for the homepage layout based on feedback',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Add to CreateTaskDto
  @ApiPropertyOptional({
    description: 'The priority level of the task',
    example: 'high',
    enum: TASK_PRIORITY,
    required: false,
  })
  @IsOptional()
  @IsEnum(TASK_PRIORITY)
  priority?: string;

  @ApiPropertyOptional({
    description: 'List of user IDs assigned to the task',
    example: ['605c72ef7c1b2c001f64f4f6'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUser?: string[];

  @ApiPropertyOptional({
    description: 'The estimated duration of the task in hours',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;



    @ApiPropertyOptional({
        description: 'task start time',
        example: '2024-02-25T11:09:10.290Z',
        required: false,
    })
    @IsOptional()
    @IsString()
    startDate?: string;


    @ApiPropertyOptional({
        description: "The subtasks of the project",
        example: ["605c72ef7c1b2c001f64f4f6", "605c72ef7c1b2c001f64f4f6"]
    })
    @IsOptional()
    subtasks?: string[];



    @ApiPropertyOptional({
        description: 'task end time',
        example: '2024-02-25T11:09:10.290Z',
        required: false,
    })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'The unique identifier of the user who last updated the task',
        example: '605c72ef7c1b2c001f64f4f6',
        required: false,
    })
    @IsOptional()
    @IsString()
    updatedBy?: string;
}


export class CreateSubtaskDto {


    @ApiProperty({
        description: 'Subtask Associated With',
        example: '605c72ef7c1b2c001f64f4f6',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    task: string;


    @ApiProperty({
        description: 'Title of the Subtask',
        example: 'Collect the requirement',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'Assigned to users',
        example: '605c72ef7c1b2c001f64f4f6',
        required: false,
    })
    @IsOptional()
    @IsString()
    assignedTo?: string;

    createdBy?: string
    updatedBy?: string

}



export class UpdateSubtaskDto {


    @ApiPropertyOptional({
        description: 'Title of the Subtask',
        example: 'Collect the requirement',
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({
        description: 'Assigned to users',
        example: '605c72ef7c1b2c001f64f4f6',
        required: false,
    })
    @IsOptional()
    @IsString()
    assignedTo?: string;


    @ApiPropertyOptional({
        description: 'If the task is completed or not',
        example: 'true',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isCompleted?: string;




    updatedBy?: string
}
