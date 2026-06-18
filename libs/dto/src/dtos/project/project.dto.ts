import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsBoolean,
    IsArray,
    IsDate,
    IsMongoId,
    ArrayNotEmpty,
    ArrayUnique,
} from 'class-validator';

// DTO for creating a project
export class CreateProjectDto {
    @ApiProperty({
        description: 'The name of the project',
        example: 'Project Alpha',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'A brief description of the project',
        example:
            'This project involves developing a new feature for the application.',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'The unique identifier of the project admin',
        example: 'ADMIN123',
    })
    @IsString()
    @IsNotEmpty()
    admin: string;


    @ApiProperty({
        description: 'The unique identifier of the project category',
        example: 'category_id_here',
    })
    @IsString()
    @IsNotEmpty()
    category: string;



    @ApiProperty({
        description: 'The unique identifier of the project subcategory',
        example: 'subcategory_id_here',
    })
    @IsString()
    @IsNotEmpty()
    subCategory: string;




    @ApiProperty({
        description: 'The start date of the project',
        example: '2024-08-05',
    })
    @IsString()
    @IsNotEmpty()
    startDate: string;



    @ApiPropertyOptional({
        description: 'The end date of the project',
        example: '2024-12-31',
        required: false,
    })
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'The status of the project (active or inactive)',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({
        description: 'The company associated with the project',
        example: 'Tech Innovations Inc.',
        required: false,
    })
    @IsOptional()
    @IsString()
    company?: string;

    @ApiPropertyOptional({
        description: 'List of users assigned to the project',
        example: ['USER123', 'USER456'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    assignedUser?: string[];
}







// DTO for updating a project
export class UpdateProjectDto {
    @ApiPropertyOptional({
        description: 'The name of the project',
        example: 'Project Beta',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'A brief description of the project',
        example: 'This project involves enhancing the current system architecture.',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'The unique identifier of the project admin',
        example: 'ADMIN456',
        required: false,
    })
    @IsOptional()
    @IsString()
    admin?: string;




    @ApiPropertyOptional({
        description: 'The unique identifier of the project category',
        example: 'category_id_here',
    })
    @IsOptional()
    @IsString()
    category?: string;



    @ApiPropertyOptional({
        description: 'The unique identifier of the project subcategory',
        example: 'subcategory_id_here',
    })
    @IsOptional()
    @IsString()
    subCategory?: string;




    @ApiPropertyOptional({
        description: 'The start date of the project',
        example: '2024-09-01',
        required: false,
    })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'The end date of the project',
        example: '2025-01-15',
        required: false,
    })
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'The status of the project (active or inactive)',
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({
        description: 'The company associated with the project',
        example: 'Innovative Solutions LLC',
        required: false,
    })
    @IsOptional()
    @IsString()
    company?: string;

    @ApiPropertyOptional({
        description: 'List of users assigned to the project',
        example: ['USER789', 'USER101'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    assignedUser?: string[];
}

// DTO for creating project history
export class CreateProjectHistoryDto {
    @ApiProperty({
        description:
            'The unique identifier of the user who created the project history entry',
        example: '605c72ef7c1b2c001f64f4f3',
    })
    @IsNotEmpty()
    @IsMongoId()
    createdBy: string;

    @ApiProperty({
        description: 'The message or description of the project history entry',
        example: 'Project initial setup completed.',
    })
    @IsNotEmpty()
    @IsString()
    message: string;

    @ApiProperty({
        description: 'The date and time when the project history entry was created',
        example: '2024-08-05T12:00:00Z',
    })
    @IsNotEmpty()
    @IsDate()
    time: Date;

    @ApiProperty({
        description:
            'The unique identifier of the project associated with the history entry',
        example: '605c72ef7c1b2c001f64f4f4',
    })
    @IsNotEmpty()
    @IsMongoId()
    projectID: string;
}

// DTO for updating project history
export class UpdateProjectHistoryDto {
    @ApiPropertyOptional({
        description:
            'The unique identifier of the user who created the project history entry',
        example: '605c72ef7c1b2c001f64f4f3',
        required: false,
    })
    @IsOptional()
    @IsMongoId()
    createdBy?: string;

    @ApiPropertyOptional({
        description: 'The message or description of the project history entry',
        example: 'Project milestone reached.',
        required: false,
    })
    @IsOptional()
    @IsString()
    message?: string;

    @ApiPropertyOptional({
        description: 'The date and time when the project history entry was created',
        example: '2024-08-06T15:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDate()
    time?: Date;

    @ApiPropertyOptional({
        description:
            'The unique identifier of the project associated with the history entry',
        example: '605c72ef7c1b2c001f64f4f4',
        required: false,
    })
    @IsOptional()
    @IsMongoId()
    projectID?: string;
}

// DTO for creating a project document
export class ProjectDocumentCreateDto {
    @ApiProperty({
        description: 'The unique identifier of the user who created the document',
        example: '605c72ef7c1b2c001f64f4f3',
    })
    @IsString()
    @IsNotEmpty()
    createdBy: string;

    @ApiPropertyOptional({
        description: 'The name of the document',
        example: 'Project Proposal',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'The content of the document',
        example: 'This document contains the project proposal details...',
    })
    @IsNotEmpty()
    @IsString()
    document: string;

    @ApiProperty({
        description:
            'The unique identifier of the project to which the document belongs',
        example: '605c72ef7c1b2c001f64f4f4',
    })
    @IsString()
    @IsNotEmpty()
    project: string;

    @ApiProperty({
        description: 'Indicates whether the document is public or not',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    isPublic: boolean;

    @ApiPropertyOptional({
        description: 'List of members who have access to the document',
        example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    members?: string[];
}

// DTO for updating a project document
export class ProjectDocumentUpdateDto {
    @ApiPropertyOptional({
        description: 'The name of the document',
        example: 'Updated Project Proposal',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'List of members who have access to the document',
        example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    members?: string[];
}


export class ProjectCredentialCreateDto {
    @ApiProperty({
        description: 'The unique identifier of the user who created the credential',
        example: '605c72ef7c1b2c001f64f4f3',
    })
    @IsNotEmpty()
    @IsString()
    createdBy: string;

    @ApiProperty({
        description: 'The name of the credential',
        example: 'GitHub Access',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The URL associated with the credential',
        example: 'https://github.com/username/repository',
    })
    @IsNotEmpty()
    @IsString()
    url: string;

    @ApiProperty({
        description: 'The username for the credential',
        example: 'username123',
    })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({
        description: 'The password for the credential',
        example: 'password123',
    })
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty({
        description:
            'The unique identifier of the project associated with the credential',
        example: '605c72ef7c1b2c001f64f4f4',
    })
    @IsNotEmpty()
    @IsString()
    project: string;

    @ApiPropertyOptional({
        description: 'List of members who have access to the credential',
        example: ['605c72ef7c1b2c001f64f4f3', '605c72ef7c1b2c001f64f4f4'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    members?: string[];
}

// DTO for updating project credentials
export class ProjectCredentialUpdateDto {
    @ApiPropertyOptional({
        description: 'The name of the credential',
        example: 'Updated GitHub Access',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'List of members who have access to the credential',
        example: ['605c72ef7c1b2c001f64f4f3'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    members?: string[];
}
