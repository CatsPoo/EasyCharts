import { IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
export class QueryDto {
  @IsOptional() @IsInt() @Min(0) page?: number;
  @IsOptional() @IsInt() @Min(1) pageSize?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['asc','desc']) sortDir?: 'asc'|'desc';
}