import { IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateModelDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateModelDto extends PartialType(CreateModelDto) {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}