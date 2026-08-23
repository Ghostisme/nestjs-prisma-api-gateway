import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class BannedWordsFilterDto {
  @ApiProperty({ description: '模型筛选', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: '智能体筛选', required: false })
  @IsString()
  @IsOptional()
  agent?: string;

  @ApiProperty({
    description: '时间范围（all/yesterday/last7days/last30days/custom）',
    default: 'all',
    required: false,
  })
  @IsString()
  @IsOptional()
  timeRange?: string = 'all';

  @ApiProperty({ description: '自定义时间范围 [开始日期, 结束日期]', required: false })
  @IsArray()
  @IsOptional()
  customRange?: string[];
}

export class CreateBannedWordDto {
  @ApiProperty({ description: '违禁词类型' }) @IsString() category: string;
  @ApiProperty({ description: '风险等级（high/medium/low）' }) @IsString() riskLevel: string;
  @ApiProperty({ description: '违禁词内容', maxLength: 20 }) @IsString() @MaxLength(20) word: string;
  @ApiProperty({ description: '触发方式（input/output）', type: [String] }) @IsArray() triggerMode: string[];
  @ApiProperty({ description: '匹配方式（exact/fuzzy/semantic/model）', type: [String] }) @IsArray() matchMode: string[];
}

export class ToggleBannedWordDto {
  @ApiProperty({ description: '目标状态（enabled/disabled）' })
  @IsString()
  @IsOptional()
  status?: string;
}
