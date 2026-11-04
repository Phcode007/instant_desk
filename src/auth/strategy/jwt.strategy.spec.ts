import { UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('uses the current role from the database, not the token', async () => {
    const userService = {
      findForAuthentication: jest.fn().mockResolvedValue({
        id: 42,
        usuario: 'user@example.com',
        role: 'USER',
        company: { id: 7 },
      }),
    } as unknown as UserService;
    const strategy = new JwtStrategy(userService);

    await expect(
      strategy.validate({ id: 42, role: 'ADMIN' } as { id: number }),
    ).resolves.toEqual({
      sub: 'user@example.com',
      id: 42,
      company_id: 7,
      role: 'USER',
    });
  });

  it('rejects tokens for missing users', async () => {
    const userService = {
      findForAuthentication: jest.fn().mockResolvedValue(null),
    } as unknown as UserService;
    const strategy = new JwtStrategy(userService);

    await expect(strategy.validate({ id: 42 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});