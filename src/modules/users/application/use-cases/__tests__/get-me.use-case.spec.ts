import { GetMeUseCase } from '../get-me.use-case';
import { GetUserByIdUseCase } from '../get-user-by-id.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserResponseDto } from '../../dto/user.response.dto';
import {
  UserExceptions,
  UserNotFoundException,
} from '@/modules/users/domain/exceptions/user.exception';

describe('GetMeUseCase', () => {
  let getMeUseCase: GetMeUseCase;
  let getUserByIdUseCase: jest.Mocked<GetUserByIdUseCase>;

  beforeEach(() => {
    getUserByIdUseCase = {
      execute: jest.fn(),
    } as any;

    getMeUseCase = new GetMeUseCase(getUserByIdUseCase);
  });

  it('should return user from getUserByIdUseCase', async () => {
    const user: JwtPayload = { userId: 'id123', email: 'john@doe.com' };
    const expectedUser = {
      id: 'id123',
      username: 'john',
    } as unknown as UserResponseDto;

    getUserByIdUseCase.execute.mockResolvedValue(expectedUser);

    const result = await getMeUseCase.execute(user);

    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith('id123');
    expect(result).toBe(expectedUser);
  });

  it('should propagate error from getUserByIdUseCase', async () => {
    const user: JwtPayload = { userId: 'id123', email: 'john@doe.com' };
    getUserByIdUseCase.execute.mockRejectedValue(
      UserExceptions.notFound('id123'),
    );

    await expect(getMeUseCase.execute(user)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith('id123');
  });

  it('should throw if userId is undefined', async () => {
    const user: JwtPayload = { userId: undefined, email: 'john@doe.com' };
    getUserByIdUseCase.execute.mockRejectedValue(
      UserExceptions.notFound('undefined'),
    );
    await expect(getMeUseCase.execute(user)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(undefined);
  });
});
