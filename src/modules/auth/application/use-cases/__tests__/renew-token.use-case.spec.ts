import { RenewTokenUseCase } from '../renew-token.use-case';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('RenewTokenUseCase', () => {
  let useCase: RenewTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
    } as any;

    useCase = new RenewTokenUseCase(jwtService);
  });

  it('should return a renewed token', () => {
    const payload: JwtPayload & { isTwoFactorEnabled?: boolean; role?: any } = {
      userId: 'user-1',
      email: 'john@example.com',
      isTwoFactorEnabled: false,
      role: { id: '1', name: 'admin' },
    };

    jwtService.sign.mockReturnValue('new.token');

    const result = useCase.execute(payload);

    expect(jwtService.sign).toHaveBeenCalledWith(payload, {
      expiresIn: undefined,
    });
    expect(result).toEqual({ accessToken: 'new.token' });
  });
});
