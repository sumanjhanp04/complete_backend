import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches } from "class-validator";


export class TimeSheetDto{
 @ApiProperty({
    description: 'This is the description of TimeSheet',
    example: 'Complete the frontend',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'This is the submit date of TimeSheet',
    example: '2025-02-16',
  })
  @IsString()
  @IsNotEmpty()
  // Todo: fix the regex
  @Matches(/^(?:(?:\d{4}-(?:0[13578]|1[02])-(?:0[1-9]|[12][0-9]|3[01]))|(?:\d{4}-(?:0[469]|11)-(?:0[1-9]|[12][0-9]|30))|(?:\d{4}-02-(?:0[1-9]|1\d|2[0-8]))|(?:(?:\d{2}(?:0[48]|[2468][048]|[13579][26])|(?:[02468][048]|[1359][26])00)-02-29))$/g)
  submitDate: string;

  @ApiProperty({
    description:"This is the time duration of given work and it always a positive number",
    example:123
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  duration:number;
  
}