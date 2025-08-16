import { IsOptional, IsString, MinLength, IsUUID, isString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Identifiable } from 'src/generic.interface.js';

export class CreateDeviceDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  type!: string;

  @IsUUID() 
  modelId!:string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}