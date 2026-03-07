import { JwtStrategy } from './jwt.strategy';
import { AppConfigService } from '../../appConfig/appConfig.service';

const mockAppConfigService = {
  getConfig: jest.fn().mockReturnValue({
    jwt: { secret: 'test-secret' },
    refreshJwt: { secret: 'refresh-secret' },
  }),
} as unknown as AppConfigService;

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(mockAppConfigService);
  });

  it('validate — returns payload.sub', () => {
    const result = strategy.validate({ sub: 'user-1' });
    expect(result).toBe('user-1');
  });
});
