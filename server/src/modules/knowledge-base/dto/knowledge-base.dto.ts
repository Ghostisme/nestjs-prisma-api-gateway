import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class KnowledgeBaseListDto extends PaginationDto {
  @ApiProperty({ description: '知识库名称', required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ description: '标签', required: false }) @IsString() @IsOptional() tag?: string;
  @ApiProperty({ description: '状态（enabled/disabled）', required: false }) @IsString() @IsOptional() status?: string;
}

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: '知识库名称', maxLength: 50 }) @IsString() @MaxLength(50) name: string;
  @ApiProperty({ description: '知识库描述', maxLength: 300 }) @IsString() @MaxLength(300) description: string;
  @ApiProperty({ description: '标签列表', type: [String], required: false }) @IsArray() @IsOptional() tags?: string[];
}

export class UpdateKnowledgeBaseDto {
  @ApiProperty({ description: '知识库名称', required: false }) @IsString() @IsOptional() @MaxLength(50) name?: string;
  @ApiProperty({ description: '知识库描述', required: false }) @IsString() @IsOptional() @MaxLength(300) description?: string;
  @ApiProperty({ description: '标签列表', type: [String], required: false }) @IsArray() @IsOptional() tags?: string[];
}

export class UpdateStatusDto {
  @ApiProperty({ description: '状态（enabled/disabled）' }) @IsString() status: string;
}
