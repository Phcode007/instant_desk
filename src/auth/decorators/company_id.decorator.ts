import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { company_id?: number | null };
}

export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.company_id ?? null;
  },
);
