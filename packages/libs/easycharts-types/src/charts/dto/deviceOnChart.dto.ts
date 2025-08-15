import { Type } from "class-transformer";
import { PositionDto } from "./position.dto.js";
import { IsUUID, ValidateNested } from "class-validator";

export class DeviceOnCharttDto {

  @IsUUID()
  deviceId!: string;

  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}