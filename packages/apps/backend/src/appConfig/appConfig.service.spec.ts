import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './appConfig.service';

const mockConfigService = {
  get: jest.fn((key: string, defaultVal: any) => defaultVal),
};

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it('getConfig returns object with all expected keys', () => {
    const config = service.getConfig();
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('jwt');
    expect(config).toHaveProperty('refreshJwt');
    expect(config).toHaveProperty('redis');
    expect(config).toHaveProperty('defaultAdminUser');
  });

  it('getConfig returns env defaults when env vars are absent', () => {
    const config = service.getConfig();
    expect(config.database.port).toBe(5432);
    expect(config.redis.port).toBe(1234);
    expect(config.defaultAdminUser.username).toBe('admin');
    expect(config.defaultAdminUser.password).toBe('admin');
  });

  it('getConfig reads env values from ConfigService', () => {
    mockConfigService.get.mockImplementation((key: string, _defaultVal: any) => {
      const map: Record<string, any> = {
        DB_USER: 'dbuser',
        DB_PASS: 'secret',
        DB_HOST: 'localhost',
        DB_PORT: 5433,
        DB_NAME: 'mydb',
        JWT_SECRET: 'jwtsecret',
        JWT_EXPIRE_IN: '1h',
        REFRESH_JWT_SECRET: 'refreshsecret',
        REFRESH_JWT_EXPIRE_IN: '7d',
        REDIS_USERNAME: 'redisuser',
        REDIS_PASSWORD: 'redispass',
        REDIS_HOST: 'redis-host',
        REDIS_PORT: 6379,
        DEFAULT_ADMIN_USERNAME: 'superadmin',
        DEFAULT_ADMIN_PASSWORD: 'superpass',
      };
      return map[key] ?? _defaultVal;
    });

    // Re-instantiate to pick up new mock values
    const svc = new AppConfigService(mockConfigService as any);
    const config = svc.getConfig();

    expect(config.database.username).toBe('dbuser');
    expect(config.database.password).toBe('secret');
    expect(config.database.host).toBe('localhost');
    expect(config.database.port).toBe(5433);
    expect(config.database.database_name).toBe('mydb');
    expect(config.jwt.secret).toBe('jwtsecret');
    expect(config.jwt.expiresIn).toBe('1h');
    expect(config.redis.host).toBe('redis-host');
    expect(config.redis.port).toBe(6379);
    expect(config.defaultAdminUser.username).toBe('superadmin');
    expect(config.defaultAdminUser.password).toBe('superpass');
  });
});
