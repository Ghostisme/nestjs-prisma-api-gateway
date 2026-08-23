import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorCode, ErrorMessage } from '../enums/error-code.enum';

export class BusinessException extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super(message ?? ErrorMessage[errorCode] ?? '未知错误');
    this.name = 'BusinessException';
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof BusinessException) {
      response.status(200).json({
        code: exception.errorCode,
        msg: exception.message,
        data: null,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const msg =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message;

      const errorMsg = Array.isArray(msg) ? msg.join('; ') : msg;

      if (status === 401 || status === 424) {
        response.status(200).json({
          code: status,
          msg: ErrorMessage[status] ?? errorMsg,
          data: null,
        });
        return;
      }

      response.status(200).json({
        code: ErrorCode.FAIL,
        msg: errorMsg ?? '请求出错，请稍候重试',
        data: null,
      });
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);

    response.status(200).json({
      code: ErrorCode.FAIL,
      msg: '服务器内部错误，请稍后重试',
      data: null,
    });
  }
}
