import { IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateVendorDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}