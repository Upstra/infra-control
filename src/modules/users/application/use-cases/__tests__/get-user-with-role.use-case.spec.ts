import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/modules/roles/domain/entities/role.entity';
import { GetUserWithRoleUseCase } from '../get-user-with-role.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { User } from '@/modules/users/domain/entities/user.entity';

describe('GetUserWithRoleUseCase', () => {
  let useCase: GetUserWithRoleUseCase;
  let userRepository: UserRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserWithRoleUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetUserWithRoleUseCase>(GetUserWithRoleUseCase);
    userRepository = module.get<UserRepositoryInterface>(
      'UserRepositoryInterface',
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return user with role when found', async () => {
    const mockUser: User = {
      id: 'user-123',
      username: 'testuser',
      roles: [
        {
          id: 'role-123',
          name: 'admin',
          canCreateServer: true,
        } as Role,
      ],
    } as User;

    jest.spyOn(userRepository, 'findOneByField').mockResolvedValue(mockUser);

    const result = await useCase.execute('user-123');

    expect(result).toEqual(mockUser);
    expect(userRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-123',
      relations: ['roles'],
    });
  });

  it('should return null when user not found', async () => {
    jest.spyOn(userRepository, 'findOneByField').mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeNull();
    expect(userRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'non-existent',
      relations: ['roles'],
    });
  });
});
