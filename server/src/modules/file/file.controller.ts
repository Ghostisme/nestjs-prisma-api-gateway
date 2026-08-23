import { Controller, Get, Param, Post, Res, Headers } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { FileService } from './file.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';

@ApiTags('文件管理')
@Controller('lumax/v1/file')
export class FileController {
  constructor(private readonly service: FileService) {}

  @Post('generate-upload-url')
  @ApiOperation({ summary: '获取 OSS 预签名上传地址', description: '代理 Java /admin/sys-file/generate-upload-url' })
  async generateUploadUrl(
    @CurrentUser() user: UserContext,
    @Headers('authorization') authorization: string,
  ) {
    return this.service.generateUploadUrl(authorization);
  }

  @Get('download/:fileId')
  @ApiOperation({ summary: '服务端流式下载文件' })
  async download(
    @Param('fileId') fileId: string,
    @Res() res: Response,
    @Headers('authorization') authorization: string,
  ) {
    return this.service.downloadFile(fileId, authorization, res);
  }
}
