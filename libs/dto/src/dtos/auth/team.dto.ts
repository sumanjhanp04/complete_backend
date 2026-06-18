import { ApiProperty, PartialType } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class CreateTeamDto {
    @ApiProperty({
        description: "Team name",
        example: 'Development Team',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: "Team Lead",
        example: '60c72b2f9b1d4c3c7f5a5f9b',
        required: true
    })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    teamLead: string;

    @ApiProperty({
        description: "Array of team member IDs",
        example: ['60c72b2f9b1d4c3c7f5a5f9b', '60c72b2f9b1d4c3c7f5a5f9d'],
        required: true
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsMongoId({ each: true })
    members: string[];


    createdBy?: string;
    updatedBy?: string;
}

export class UpdateTeamDto extends PartialType(CreateTeamDto) {

}