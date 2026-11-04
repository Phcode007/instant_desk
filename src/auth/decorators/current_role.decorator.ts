import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../user/enums/user-role.enum';

export const CurrentRole = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserRole | null => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    return request.user?.role ?? null;
  },
);
