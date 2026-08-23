import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class TokenConfigDto {
  @ApiProperty({ description: '是否不限制配额' }) @IsBoolean() unlimited: boolean;
  @ApiProperty({ description: '配额数量', required: false }) @Type(() => Number) @IsInt() @IsOptional() quota?: number;
  @ApiProperty({ description: '配额周期', required: false }) @IsString() @IsOptional() period?: string;
}
