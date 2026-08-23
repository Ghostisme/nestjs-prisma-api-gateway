import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { DictService } from './dict.service';

@ApiTags('通用字典')
@Controller('lumax/v1/dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('batch')
  @ApiOperation({ summary: '批量查询多个字典类型' })
  @ApiQuery({ name: 'typeCodes', description: '逗号分隔的类型编码列表' })
  async getBatch(@CurrentUser() user: UserContext, @Query('typeCodes') typeCodes: string) {
    const codes = typeCodes.split(',').map((c) => c.trim()).filter(Boolean);
    return this.dictService.getBatch(user.tenantId, codes);
  }

  @Get(':typeCode')
  @ApiOperation({ summary: '按类型编码查询字典项列表' })
  @ApiParam({ name: 'typeCode', description: '字典类型编码' })
  async getByTypeCode(@CurrentUser() user: UserContext, @Param('typeCode') typeCode: string) {
    return this.dictService.getByTypeCode(user.tenantId, typeCode);
  }
}
