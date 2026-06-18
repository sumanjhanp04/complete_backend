import { PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateShiftDto {
    
  @IsString()
  @IsNotEmpty()
  shiftName: string;

  
  @IsString()
  @IsNotEmpty()
  shiftStartTime: string;

  
  @IsString()
  @IsNotEmpty()
  shiftBreakTime: string;

  
  @IsString()
  @IsNotEmpty()
  shiftEndTime: string;
  
  @IsString()
  @IsOptional()
  color: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto){

}