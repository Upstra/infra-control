import { RenewTokenUseCase } from '../renew-token.use-case';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { ExtendedJwtPayload } from '../../../domain/interfaces/extended-jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { InvalidTokenException } from '../../../domain/exceptions/invalid-token.exception';
import { UnauthorizedException } from '@nestjs/common';

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
      getUserActiveStatus: jest.fn(),
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
    expect(userRepository.getUserActiveStatus).not.toHaveBeenCalled();
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

    const mockUserStatus = { isActive: true };
    userRepository.getUserActiveStatus.mockResolvedValue(mockUserStatus);

    tokenService.generateTokens.mockReturnValue({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });

    const result = await useCase.execute(refreshToken);

    expect(userRepository.getUserActiveStatus).toHaveBeenCalledWith('user-1');
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: payload.userId,
      email: payload.email,
      isTwoFactorEnabled: payload.isTwoFactorEnabled,
      role: payload.role,
      roles: payload.roles,
      isActive: mockUserStatus.isActive,
    });
    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
  });

  it('should throw InvalidTokenException when token is malformed', async () => {
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    jwtService.verify.mockImplementation(() => {
      throw error;
    });

    await expect(useCase.execute('bad.token')).rejects.toThrow(
      InvalidTokenException,
    );
    await expect(useCase.execute('bad.token')).rejects.toThrow(
      'Malformed refresh token',
    );
  });

  it('should throw UnauthorizedException when token is expired', async () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwtService.verify.mockImplementation(() => {
      throw error;
    });

    await expect(useCase.execute('expired.token')).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(useCase.execute('expired.token')).rejects.toThrow(
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
    userRepository.getUserActiveStatus.mockResolvedValue(null);

    await expect(useCase.execute(refreshToken)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw InvalidTokenException when refresh token is null', async () => {
    await expect(useCase.execute(null as any)).rejects.toThrow(
      InvalidTokenException,
    );
    await expect(useCase.execute(null as any)).rejects.toThrow(
      'Refresh token is missing or invalid',
    );
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('should throw InvalidTokenException when refresh token is undefined', async () => {
    await expect(useCase.execute(undefined as any)).rejects.toThrow(
      InvalidTokenException,
    );
    await expect(useCase.execute(undefined as any)).rejects.toThrow(
      'Refresh token is missing or invalid',
    );
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('should throw InvalidTokenException when refresh token is not a string', async () => {
    await expect(useCase.execute(123 as any)).rejects.toThrow(
      InvalidTokenException,
    );
    await expect(useCase.execute(123 as any)).rejects.toThrow(
      'Refresh token is missing or invalid',
    );
    expect(jwtService.verify).not.toHaveBeenCalled();
  });
});
