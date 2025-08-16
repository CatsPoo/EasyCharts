import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { DeviceOnCharttDto } from "./deviceOnChart.dto.js";

export class CreateChartDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => DeviceOnCharttDto)
  devicesLocations!: DeviceOnCharttDto[];

//   @IsArray()
//   @ArrayMinSize(0)
//   @ValidateNested({ each: true })
//   @Type(() => LineDto)
//   lines!: LineDto[];
}

export class UpdateChartDto extends PartialType(CreateChartDto) {}