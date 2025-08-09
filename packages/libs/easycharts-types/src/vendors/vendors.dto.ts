import { IsOptional, IsString, MinLength } from 'class-validator';
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