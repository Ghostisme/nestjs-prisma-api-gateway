import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ConversationUserListDto extends PaginationDto {
  @ApiProperty({ description: '用户名', required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ description: '部门', required: false }) @IsString() @IsOptional() department?: string;
  @ApiProperty({ description: '对话状态', required: false }) @IsString() @IsOptional() status?: string;
  @ApiProperty({ description: '最后对话开始时间', required: false }) @IsString() @IsOptional() lastConversationTimeStart?: string;
  @ApiProperty({ description: '最后对话结束时间', required: false }) @IsString() @IsOptional() lastConversationTimeEnd?: string;
}

export class ConversationDetailListDto extends PaginationDto {}
