import { RenewTokenUseCase } from '../renew-token.use-case';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { ExtendedJwtPayload } from '../../../domain/interfaces/extended-jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

const createMockUser = (overrides: any = {}) =>
  ({
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    roles: [],
    isVerified: true,
    resetPasswordToken: null,
    resetPasswordExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  }) as any;

describe('RenewTokenUseCase', () => {
  let useCase: RenewTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: jest.Mocked<TokenService>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    } as any;

    tokenService = {
      generateTokens: jest.fn(),
    } as any;

    userRepository = {
      findOneById: jest.fn(),
    } as any;

    useCase = new RenewTokenUseCase(jwtService, tokenService, userRepository);
  });

  it('should return a renewed token when isActive is present', async () => {
    const refreshToken = 'refresh.token';
    const mockJwtPayload = createMockJwtPayload({
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
      isActive: true,
    });
    const payload: ExtendedJwtPayload = {
      ...mockJwtPayload,
      roles: [mockJwtPayload.role],
    };

    jwtService.verify.mockReturnValue(payload);

    tokenService.generateTokens.mockReturnValue({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });

    const result = await useCase.execute(refreshToken);

    expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
    expect(userRepository.findOneById).not.toHaveBeenCalled();
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: payload.userId,
      email: payload.email,
      isTwoFactorEnabled: payload.isTwoFactorEnabled,
      role: payload.role,
      roles: payload.roles,
      isActive: payload.isActive,
    });
    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
  });

  it('should fetch user from database when isActive is undefined', async () => {
    const refreshToken = 'refresh.token';
    const mockJwtPayload = createMockJwtPayload({
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
    });
    const payload: ExtendedJwtPayload = {
      ...mockJwtPayload,
      roles: [mockJwtPayload.role],
      isActive: undefined,
    };

    jwtService.verify.mockReturnValue(payload);

    const mockUser = createMockUser({ id: 'user-1', isActive: true });
    userRepository.findOneById.mockResolvedValue(mockUser);

    tokenService.generateTokens.mockReturnValue({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });

    const result = await useCase.execute(refreshToken);

    expect(userRepository.findOneById).toHaveBeenCalledWith('user-1');
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: payload.userId,
      email: payload.email,
      isTwoFactorEnabled: payload.isTwoFactorEnabled,
      role: payload.role,
      roles: payload.roles,
      isActive: mockUser.isActive,
    });
    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
  });

  it('should throw UnauthorizedException when verification fails', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(useCase.execute('bad.token')).rejects.toThrow(
      'Invalid or expired refresh token',
    );
  });

  it('should throw UnauthorizedException when user is not found (with undefined isActive)', async () => {
    const refreshToken = 'refresh.token';
    const mockJwtPayload = createMockJwtPayload({
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
    });
    const payload: ExtendedJwtPayload = {
      ...mockJwtPayload,
      roles: [mockJwtPayload.role],
      isActive: undefined,
    };

    jwtService.verify.mockReturnValue(payload);
    userRepository.findOneById.mockResolvedValue(null);

    await expect(useCase.execute(refreshToken)).rejects.toThrow(
      'User not found',
    );
  });
});
