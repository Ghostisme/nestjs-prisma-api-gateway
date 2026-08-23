import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PriceTierDto {
  @ApiProperty({ description: '推理模式', default: 'online' })
  @IsString() @IsOptional()
  inferenceMode?: string;

  @ApiProperty({ description: '输入长度下限（千token）', default: 0 })
  @Type(() => Number) @IsInt() @IsOptional()
  inputLengthMin?: number;

  @ApiProperty({ description: '输入长度上限（千token），-1=无上限', default: -1 })
  @Type(() => Number) @IsInt() @IsOptional()
  inputLengthMax?: number;

  @ApiProperty({ description: '输出长度下限（千token）', default: 0 })
  @Type(() => Number) @IsInt() @IsOptional()
  outputLengthMin?: number;

  @ApiProperty({ description: '输出长度上限（千token），-1=无上限', default: -1 })
  @Type(() => Number) @IsInt() @IsOptional()
  outputLengthMax?: number;

  @ApiProperty({ description: '输入价格（元/百万token）' })
  @Type(() => Number) @IsNumber() @Min(0)
  inputPrice: number;

  @ApiProperty({ description: '输出价格（元/百万token）' })
  @Type(() => Number) @IsNumber() @Min(0)
  outputPrice: number;

  @ApiProperty({ description: '缓存存储价格（元/百万token/小时）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheStoragePrice?: number;

  @ApiProperty({ description: '缓存输入价格（元/百万token）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheReadPrice?: number;

  @ApiProperty({ description: '排序序号', required: false })
  @Type(() => Number) @IsInt() @IsOptional()
  sortOrder?: number;
}

export class LlmModelListDto extends PaginationDto {
  @ApiProperty({ description: '模型名称', required: false })
  @IsString() @IsOptional()
  modelName?: string;

  @ApiProperty({ description: '供应商', required: false })
  @IsString() @IsOptional()
  provider?: string;

  @ApiProperty({ description: '模型类型', required: false })
  @IsString() @IsOptional()
  modelType?: string;

  @ApiProperty({ description: '状态（enabled/disabled）', required: false })
  @IsString() @IsOptional()
  status?: string;
}

export class CreateLlmModelDto {
  @ApiProperty({ description: '模型编码' })
  @IsString() @MaxLength(100)
  modelCode: string;

  @ApiProperty({ description: '模型显示名称' })
  @IsString() @MaxLength(200)
  modelName: string;

  @ApiProperty({ description: '供应商' })
  @IsString() @MaxLength(100)
  provider: string;

  @ApiProperty({ description: '模型类型', required: false, default: 'chat' })
  @IsString() @IsOptional()
  modelType?: string;

  @ApiProperty({ description: '最大上下文Token数', required: false })
  @Type(() => Number) @IsInt() @Min(0) @IsOptional()
  maxContextTokens?: number;

  @ApiProperty({ description: '最大输出Token数', required: false })
  @Type(() => Number) @IsInt() @Min(0) @IsOptional()
  maxOutputTokens?: number;

  @ApiProperty({ description: '输入价格（flat模式默认价格）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  inputPrice?: number;

  @ApiProperty({ description: '输出价格（flat模式默认价格）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  outputPrice?: number;

  @ApiProperty({ description: '缓存写入价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheWritePrice?: number;

  @ApiProperty({ description: '缓存读取价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheReadPrice?: number;

  @ApiProperty({ description: '缓存存储价格（元/百万token/小时）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheStoragePrice?: number;

  @ApiProperty({ description: '计价单位', required: false, default: 'per_1k_tokens' })
  @IsString() @IsOptional()
  priceUnit?: string;

  @ApiProperty({ description: '货币', required: false, default: 'CNY' })
  @IsString() @IsOptional()
  currency?: string;

  @ApiProperty({ description: '是否启用分段定价', required: false, default: false })
  @IsBoolean() @IsOptional()
  hasTieredPricing?: boolean;

  @ApiProperty({ description: '支持的推理模式（逗号分隔）', required: false, default: 'online' })
  @IsString() @IsOptional()
  supportedInferenceModes?: string;

  @ApiProperty({ description: '分段定价列表', required: false, type: [PriceTierDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceTierDto) @IsOptional()
  priceTiers?: PriceTierDto[];

  @ApiProperty({ description: '排序序号', required: false })
  @Type(() => Number) @IsInt() @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: '模型描述', required: false })
  @IsString() @IsOptional() @MaxLength(500)
  description?: string;
}

export class UpdateLlmModelDto {
  @ApiProperty({ description: '模型显示名称', required: false })
  @IsString() @IsOptional() @MaxLength(200)
  modelName?: string;

  @ApiProperty({ description: '供应商', required: false })
  @IsString() @IsOptional() @MaxLength(100)
  provider?: string;

  @ApiProperty({ description: '模型类型', required: false })
  @IsString() @IsOptional()
  modelType?: string;

  @ApiProperty({ description: '最大上下文Token数', required: false })
  @Type(() => Number) @IsInt() @Min(0) @IsOptional()
  maxContextTokens?: number;

  @ApiProperty({ description: '最大输出Token数', required: false })
  @Type(() => Number) @IsInt() @Min(0) @IsOptional()
  maxOutputTokens?: number;

  @ApiProperty({ description: '输入价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  inputPrice?: number;

  @ApiProperty({ description: '输出价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  outputPrice?: number;

  @ApiProperty({ description: '缓存写入价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheWritePrice?: number;

  @ApiProperty({ description: '缓存读取价格', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheReadPrice?: number;

  @ApiProperty({ description: '缓存存储价格（元/百万token/小时）', required: false })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  cacheStoragePrice?: number;

  @ApiProperty({ description: '计价单位', required: false })
  @IsString() @IsOptional()
  priceUnit?: string;

  @ApiProperty({ description: '货币', required: false })
  @IsString() @IsOptional()
  currency?: string;

  @ApiProperty({ description: '是否启用分段定价', required: false })
  @IsBoolean() @IsOptional()
  hasTieredPricing?: boolean;

  @ApiProperty({ description: '支持的推理模式（逗号分隔）', required: false })
  @IsString() @IsOptional()
  supportedInferenceModes?: string;

  @ApiProperty({ description: '分段定价列表（提供时全量替换）', required: false, type: [PriceTierDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceTierDto) @IsOptional()
  priceTiers?: PriceTierDto[];

  @ApiProperty({ description: '排序序号', required: false })
  @Type(() => Number) @IsInt() @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: '模型描述', required: false })
  @IsString() @IsOptional() @MaxLength(500)
  description?: string;
}

export class UpdateLlmModelStatusDto {
  @ApiProperty({ description: '状态（enabled/disabled）' })
  @IsString()
  status: string;
}
