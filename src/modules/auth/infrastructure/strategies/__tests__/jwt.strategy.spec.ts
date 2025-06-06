import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../jwt.strategy';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(),
  },
  Strategy: jest.fn(),
}));

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn().mockImplementation((strategy) => {
    return class MockPassportStrategy {
      constructor(options: any) {
        strategy.call(this, options);
      }
    };
  }),
}));
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  const mockExtractJwt = require('passport-jwt').ExtractJwt;
  const mockStrategy = require('passport-jwt').Strategy;

  const mockJwtExtractor = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockConfigService = {
      get: jest.fn(),
    };

    mockExtractJwt.fromAuthHeaderAsBearerToken.mockReturnValue(
      mockJwtExtractor,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should configure JWT extraction from Bearer token', () => {
      expect(mockExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalled();
    });

    it('should get JWT_SECRET from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should configure strategy with correct options', async () => {
      const expectedSecret = 'test-jwt-secret';

      mockStrategy.mockClear();

      const testConfigService = {
        get: jest.fn().mockReturnValue(expectedSecret),
      };

      await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: testConfigService,
          },
        ],
      }).compile();

      expect(mockStrategy).toHaveBeenCalledWith({
        jwtFromRequest: mockJwtExtractor,
        ignoreExpiration: false,
        secretOrKey: expectedSecret,
      });
    });

    it('should set ignoreExpiration to false by default', () => {
      expect(mockStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          ignoreExpiration: false,
        }),
      );
    });
  });

  describe('validate()', () => {
    it('should return AuthenticatedUserDto with correct properties', async () => {
      const mockRole = createMockRole();
      const payload = {
        userId: 'user-123',
        email: 'john.doe@example.com',
        isTwoFactorEnabled: true,
        role: mockRole,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        email: 'john.doe@example.com',
        isTwoFactorEnabled: true,
        role: mockRole,
      });
    });

    it('should handle two-factor disabled user', async () => {
      const mockRole = createMockRole();
      const payload = {
        userId: 'user-456',
        email: 'jane.smith@example.com',
        isTwoFactorEnabled: false,
        role: mockRole,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-456',
        email: 'jane.smith@example.com',
        isTwoFactorEnabled: false,
        role: mockRole,
      });
    });

    it('should handle different role data', async () => {
      const customRole = createMockRole({
        id: 'admin-role',
        name: 'Administrator',
      });

      const payload = {
        userId: 'admin-user',
        email: 'admin@example.com',
        isTwoFactorEnabled: true,
        role: customRole,
      };

      const result = await strategy.validate(payload);

      expect(result.role).toEqual(customRole);
      expect(result.userId).toBe('admin-user');
    });

    it('should handle payload with extra properties', async () => {
      const mockRole = createMockRole();
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        isTwoFactorEnabled: true,
        role: mockRole,
        iat: 1234567890,
        exp: 1234567890,
        extraProperty: 'should-be-ignored',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        isTwoFactorEnabled: true,
        role: mockRole,
      });

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('extraProperty');
    });

    it('should handle null payload gracefully', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        "Cannot read properties of null (reading 'userId')",
      );
    });

    it('should handle empty payload object', async () => {
      const result = await strategy.validate({});

      expect(result).toEqual({
        userId: undefined,
        email: undefined,
        isTwoFactorEnabled: undefined,
        role: undefined,
      });
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing JWT_SECRET', () => {
      mockStrategy.mockClear();

      const testConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new JwtStrategy(testConfigService as any);
      }).not.toThrow();

      expect(mockStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          secretOrKey: undefined,
        }),
      );
    });

    it('should handle empty JWT_SECRET', () => {
      mockStrategy.mockClear();

      const testConfigService = {
        get: jest.fn().mockReturnValue(''),
      };

      new JwtStrategy(testConfigService as any);

      expect(mockStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          secretOrKey: '',
        }),
      );
    });
  });

  describe('Passport Integration', () => {
    it('should use correct JWT extraction method', () => {
      expect(mockExtractJwt.fromAuthHeaderAsBearerToken).toHaveBeenCalled();
      expect(mockStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          jwtFromRequest: mockJwtExtractor,
        }),
      );
    });

    it('should not ignore token expiration', () => {
      expect(mockStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          ignoreExpiration: false,
        }),
      );
    });
  });
});
