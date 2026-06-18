import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TimeSheetCommentDto{
     @ApiProperty({
        description: "This is the description of TimeSheet's comment",
        example: 'Change the front of the value',
      })
      @IsString()
      @IsNotEmpty()
      message: string;
}