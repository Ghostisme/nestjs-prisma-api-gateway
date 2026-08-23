import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class TokenUserListDto extends PaginationDto {
  @ApiProperty({ description: '用户名', required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ description: '部门', required: false }) @IsString() @IsOptional() department?: string;
  @ApiProperty({ description: '是否达到配额上限', required: false }) @IsString() @IsOptional() quotaLimit?: string;
  @ApiProperty({ description: '最后使用开始时间', required: false }) @IsString() @IsOptional() lastUsedTimeStart?: string;
  @ApiProperty({ description: '最后使用结束时间', required: false }) @IsString() @IsOptional() lastUsedTimeEnd?: string;
}

export class QuotaOperationDto {
  @ApiProperty({ description: '操作类型（noChange/increase/decrease/unlimited）' })
  @IsString()
  operationType: string;

  @ApiProperty({ description: '变更数量', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiProperty({ description: '变更数量（兼容前端字段名）', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  amount?: number;
}

export class ConsumptionListDto extends PaginationDto {}
