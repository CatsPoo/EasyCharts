import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

const mockAuthService = {
  validateUser: jest.fn(),
} as unknown as AuthService;

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new LocalStrategy(mockAuthService);
  });

  it('validate — delegates to authService.validateUser and returns userId', async () => {
    (mockAuthService.validateUser as jest.Mock).mockResolvedValue('user-1');
    const result = await strategy.validate('alice', 'secret');
    expect(mockAuthService.validateUser).toHaveBeenCalledWith('alice', 'secret');
    expect(result).toBe('user-1');
  });

  it('validate — propagates rejection from authService.validateUser', async () => {
    (mockAuthService.validateUser as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    await expect(strategy.validate('alice', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});
