import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Key 名称' }) @IsString() name: string;
  @ApiProperty({ description: '作用域列表', required: false }) @IsArray() @IsOptional() scopes?: string[];
  @ApiProperty({ description: '速率限制（每分钟请求数）', required: false }) @Type(() => Number) @IsInt() @IsOptional() rateLimit?: number;
  @ApiProperty({ description: '过期时间', required: false }) @IsDateString() @IsOptional() expiresAt?: string;
}

export class ApiKeyQueryDto {
  @ApiProperty({ description: '状态筛选', required: false }) @IsString() @IsOptional() status?: string;
  @ApiProperty({ description: '页码', required: false }) @Type(() => Number) @IsInt() @IsOptional() page?: number;
  @ApiProperty({ description: '每页大小', required: false }) @Type(() => Number) @IsInt() @IsOptional() pageSize?: number;
}
