import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserContext } from '../interfaces/user-context.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContext = request.user;
    return data ? user?.[data] : user;
  },
);
