// src/devices/dto/devices.dto.ts
import { IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDeviceDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  type!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}
