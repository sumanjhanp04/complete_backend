import { ApiProperty } from "@nestjs/swagger";
import {  IsArray, IsNotEmpty, IsNumber, IsString, registerDecorator, Validate, ValidateNested, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { FileMetadata } from "../credentials/create-file-credentials.dto";
import { Type } from "class-transformer";
import { MAX_OTHER_FILE_SIZE_ALLOWED, MAX_VIDEO_FILE_SIZE_ALLOWED, VIDEO_FILE_TYPE, } from "@lib/common";

export class ChatDto{
    @ApiProperty({
        description: 'The id of the message',
        example: '6809e23f76c3c9554d4dd382',
    })
    @IsString()
    id:string;
}

export class roomIdDto{
    @ApiProperty({
        description: 'The id of the room',
        example: '6809e23f76c3c9554d4dd382',
    })
    @IsString()
    id:string;
}

@ValidatorConstraint({ name: 'IsValidFileSize', async: false })
export class FileSizeConstraint implements ValidatorConstraintInterface {
  validate(size: number, args: ValidationArguments) {
    const object = args.object as any;
    const type = object.type;
    
    if(VIDEO_FILE_TYPE.includes(type)) return size <= MAX_VIDEO_FILE_SIZE_ALLOWED;
    return size <= MAX_OTHER_FILE_SIZE_ALLOWED; 
  }
  defaultMessage(args: ValidationArguments) {
  return `File size is too large`;
}
}

export function IsValidFileSize(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: FileSizeConstraint,
    });
  };
}



export class ChatFileMetadata{
      @ApiProperty({
        description: 'The file name',
        type: String,
        required: true,
        example: 'file.jpeg',
      })
      @IsString()
      filename: string;
    
      @ApiProperty({
        description: 'The file size in bytes',
        type: Number,
        required: true,
        example: 1024,
      })
      @IsNumber()
      @IsValidFileSize()
      size: number;
    
      @ApiProperty({
        description: 'The file content type',
        type: String,
        required: true,
        example: 'image/jpeg',
      })
      @IsString()
      type: string;
    
} 

export class CreateChatFileCredentialDto {
 @ApiProperty({
    type: () => [ChatFileMetadata],
    description: 'The files to upload',
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatFileMetadata)
  files: ChatFileMetadata[];

    @ApiProperty({
        description: 'The id of the room',
        example: '6809e23f76c3c9554d4dd382',
    })
    @IsString()
    id:string;
}

