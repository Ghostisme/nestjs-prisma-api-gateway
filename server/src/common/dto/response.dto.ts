import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode, ErrorMessage } from '../enums/error-code.enum';

export class R<T = any> {
  @ApiProperty({ description: '状态码，0=成功，1=失败，其他为业务错误码' })
  code: number;

  @ApiProperty({ description: '提示消息', required: false })
  msg?: string;

  @ApiProperty({ description: '数据' })
  data?: T;

  static ok<T>(data?: T, msg?: string): R<T> {
    return { code: ErrorCode.SUCCESS, msg: msg ?? ErrorMessage[ErrorCode.SUCCESS], data };
  }

  static fail(code: ErrorCode = ErrorCode.FAIL, msg?: string): R<null> {
    return { code, msg: msg ?? ErrorMessage[code] ?? ErrorMessage[ErrorCode.FAIL], data: null };
  }
}

export class PageResult<T = any> {
  @ApiProperty({ description: '数据列表' })
  records: T[];

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '每页条数' })
  size: number;

  @ApiProperty({ description: '当前页码' })
  current: number;

  @ApiProperty({ description: '总页数' })
  pages: number;

  static of<T>(records: T[], total: number, current: number, size: number): PageResult<T> {
    return {
      records,
      total,
      size,
      current,
      pages: Math.ceil(total / size),
    };
  }
}
