import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwdAuthGuard } from './jwtAuth.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AppConfigService } from '../../appConfig/appConfig.service';

const SECRET = 'test-secret';

const mockAppConfigService = {
  getConfig: () => ({ jwt: { secret: SECRET } }),
};

function makeCtx(token: string | null): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token ? { authorization: `Bearer ${token}` } : {},
      }),
      getResponse: () => ({}),
      getNext: () => () => {},
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
    getType: () => 'http',
  } as any;
}

describe('JwdAuthGuard', () => {
  let guard: JwdAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: SECRET }),
      ],
      providers: [
        JwdAuthGuard,
        JwtStrategy,
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    guard = module.get(JwdAuthGuard);
    jwtService = module.get(JwtService);
  });

  it('allows a request carrying a valid token', async () => {
    const token = await jwtService.signAsync({ sub: 'user-1' });
    await expect(guard.canActivate(makeCtx(token))).resolves.toBe(true);
  });

  it('throws UnauthorizedException when no token is provided', async () => {
    await expect(guard.canActivate(makeCtx(null))).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for a token with an invalid signature', async () => {
    // A well-formed JWT but signed with the wrong secret
    const tampered = await jwtService.signAsync({ sub: 'user-1' }, { secret: 'wrong-secret' });
    await expect(guard.canActivate(makeCtx(tampered))).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for a malformed token string', async () => {
    const malformed = 'not.a.jwt';
    await expect(guard.canActivate(makeCtx(malformed))).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for an expired token', async () => {
    // Set exp to 60 seconds in the past so the token is definitely expired
    const pastExp = Math.floor(Date.now() / 1000) - 60;
    const expiredToken = jwtService.sign({ sub: 'user-1', exp: pastExp });
    await expect(guard.canActivate(makeCtx(expiredToken))).rejects.toThrow(UnauthorizedException);
  });
});
