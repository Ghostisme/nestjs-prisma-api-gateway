import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PartnerListDto extends PaginationDto {
  @ApiProperty({ description: '品牌名称', required: false }) @IsString() @IsOptional() brandName?: string;
  @ApiProperty({ description: '合作企业名称', required: false }) @IsString() @IsOptional() partnerName?: string;
  @ApiProperty({ description: '状态（0=启用，1=禁用）', required: false }) @Type(() => Number) @IsInt() @IsOptional() status?: number;
}

export class CreatePartnerDto {
  @ApiProperty({ description: '品牌ID' }) @Type(() => Number) @IsInt() brandId: number;
  @ApiProperty({ description: '合作企业名称' }) @IsString() partnerName: string;
  @ApiProperty({ description: '联系人', required: false }) @IsString() @IsOptional() contactPerson?: string;
  @ApiProperty({ description: '联系电话', required: false }) @IsString() @IsOptional() contactPhone?: string;
  @ApiProperty({ description: '后台模块权限', type: [String], required: false }) @IsArray() @IsOptional() backendModules?: string[];
  @ApiProperty({ description: 'AI功能权限', type: [String], required: false }) @IsArray() @IsOptional() aiFunctions?: string[];
  @ApiProperty({ description: '状态（0=启用，1=禁用）', required: false }) @Type(() => Number) @IsInt() @IsOptional() status?: number;
}

export class UpdatePartnerDto extends CreatePartnerDto {}

export class CreatePartnerUserDto {
  @ApiProperty({ description: '用户名' }) @IsString() username: string;
  @ApiProperty({ description: '密码' }) @IsString() password: string;
  @ApiProperty({ description: '邮箱', required: false }) @IsString() @IsOptional() email?: string;
  @ApiProperty({ description: '手机号', required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty({ description: '姓名', required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ description: '角色ID', required: false }) @Type(() => Number) @IsInt() @IsOptional() roleId?: number;
}
