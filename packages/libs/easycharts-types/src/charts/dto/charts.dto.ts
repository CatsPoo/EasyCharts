import { IsOptional, IsString } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";

export class CreateChartDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // @IsArray()
  // @ArrayMinSize(0)
  // @ValidateNested({ each: true })
  // @Type(() => DeviceOnCharttDto)
  // devicesLocations!: DeviceOnCharttDto[];

//   @IsArray()
//   @ArrayMinSize(0)
//   @ValidateNested({ each: true })
//   @Type(() => LineDto)
//   lines!: LineDto[];
}

export class UpdateChartDto extends PartialType(CreateChartDto) {}