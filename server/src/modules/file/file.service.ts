import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly javaGatewayUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.javaGatewayUrl = this.configService.get<string>(
      'JAVA_GATEWAY_URL',
      'http://localhost:8080/api',
    );
  }

  async generateUploadUrl(authorization: string) {
    try {
      const resp = await fetch(
        `${this.javaGatewayUrl}/admin/sys-file/generate-upload-url`,
        {
          method: 'POST',
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
            'Business-Code': 'xdwx',
          },
        },
      );
      return resp.json();
    } catch (err) {
      this.logger.error('Generate upload URL failed', err);
      throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
    }
  }

  async downloadFile(fileId: string, authorization: string, res: Response) {
    try {
      const resp = await fetch(
        `${this.javaGatewayUrl}/admin/sys-file/${fileId}`,
        {
          method: 'GET',
          headers: {
            Authorization: authorization,
            'Business-Code': 'xdwx',
          },
        },
      );

      if (!resp.ok) {
        throw new BusinessException(ErrorCode.FILE_DOWNLOAD_FAILED);
      }

      const contentType = resp.headers.get('content-type') ?? 'application/octet-stream';
      const contentDisposition = resp.headers.get('content-disposition');

      res.setHeader('Content-Type', contentType);
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }

      const body = resp.body;
      if (!body) {
        throw new BusinessException(ErrorCode.FILE_DOWNLOAD_FAILED);
      }

      const reader = body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };

      await pump();
    } catch (err) {
      if (err instanceof BusinessException) throw err;
      this.logger.error('File download failed', err);
      throw new BusinessException(ErrorCode.FILE_DOWNLOAD_FAILED);
    }
  }
}
