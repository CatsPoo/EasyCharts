import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateModelDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class UpdateModelDto extends PartialType(CreateModelDto) {}