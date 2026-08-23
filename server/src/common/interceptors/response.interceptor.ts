import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { R } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'code' in data && 'msg' in data) {
          return data;
        }
        return R.ok(data);
      }),
    );
  }
}
