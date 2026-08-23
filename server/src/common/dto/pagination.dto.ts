import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ description: '当前页码', default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  current?: number = 1;

  @ApiProperty({ description: '每页条数', default: 10, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  size?: number = 10;
}
