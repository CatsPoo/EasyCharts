import { UnauthorizedException } from '@nestjs/common';
import { RefreshStrategy } from './refreshstrategy';
import { AppConfigService } from '../../appConfig/appConfig.service';
import { AuthService } from '../auth.service';

const mockAppConfigService = {
  getConfig: jest.fn().mockReturnValue({
    jwt: { secret: 'test-secret' },
    refreshJwt: { secret: 'refresh-secret' },
  }),
} as unknown as AppConfigService;

const mockAuthService = {
  valudateRefreshToken: jest.fn(),
} as unknown as AuthService;

describe('RefreshStrategy', () => {
  let strategy: RefreshStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new RefreshStrategy(mockAppConfigService, mockAuthService);
  });

  it('validate — extracts bearer token and calls authService.valudateRefreshToken', async () => {
    const mockUser = { id: 'user-1' };
    (mockAuthService.valudateRefreshToken as jest.Mock).mockResolvedValue(mockUser);

    const req = { headers: { authorization: 'Bearer my-refresh-token' } } as any;
    const payload = { sub: 'user-1' };

    const result = await strategy.validate(req, payload);

    expect(mockAuthService.valudateRefreshToken).toHaveBeenCalledWith('user-1', 'my-refresh-token');
    expect(result).toEqual(mockUser);
  });

  it('validate — throws UnauthorizedException when no Authorization header', async () => {
    const req = { headers: {} } as any;
    const payload = { sub: 'user-1' };

    expect(() => strategy.validate(req, payload)).toThrow(UnauthorizedException);
  });

  it('validate — throws UnauthorizedException when Authorization header has no token', async () => {
    const req = { headers: { authorization: '' } } as any;
    const payload = { sub: 'user-1' };

    expect(() => strategy.validate(req, payload)).toThrow(UnauthorizedException);
  });
});
