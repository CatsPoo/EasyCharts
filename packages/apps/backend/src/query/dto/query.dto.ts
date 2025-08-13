import { IsInt, IsOptional, IsString, Min, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}

export class ListModelsQueryDto extends QueryDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
