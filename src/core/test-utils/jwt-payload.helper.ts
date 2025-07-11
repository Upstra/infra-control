import { JwtPayload } from '@/core/types/jwt-payload.interface';

export function createMockJwtPayload(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    userId: 'test-user-id',
    email: 'test@example.com',
    isTwoFactorEnabled: false,
    role: { id: '1', name: 'user' },
    isActive: true,
    ...overrides,
  };
}