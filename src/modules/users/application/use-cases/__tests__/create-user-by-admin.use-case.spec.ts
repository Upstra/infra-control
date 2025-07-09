import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserByAdminUseCase } from '../create-user-by-admin.use-case';
import { UserRepositoryInterface } from '../../../domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { UserDomainService } from '../../../domain/services/user.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { UserCreateDto } from '../../dto/user.create.dto';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { UserExceptions } from '../../../domain/exceptions/user.exception';
import { EmailEventType } from '@/modules/email/domain/events/email.events';

describe('CreateUserByAdminUseCase', () => {
  let useCase: CreateUserByAdminUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let userDomainService: jest.Mocked<UserDomainService>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = new User();
  mockUser.id = '123e4567-e89b-12d3-a456-426614174000';
  mockUser.username = 'testuser';
  mockUser.email = 'test@example.com';
  mockUser.firstName = 'Test';
  mockUser.lastName = 'User';
  mockUser.roles = [];

  const mockRole1 = new Role();
  mockRole1.id = 'role1-id';
  mockRole1.name = 'User';

  const mockRole2 = new Role();
  mockRole2.id = 'role2-id';
  mockRole2.name = 'Admin';

  const adminId = 'admin-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserByAdminUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: 'RoleRepositoryInterface',
          useValue: {
            findByIds: jest.fn(),
          },
        },
        {
          provide: UserDomainService,
          useValue: {
            createUserEntity: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateUserByAdminUseCase>(CreateUserByAdminUseCase);
    userRepository = module.get('UserRepositoryInterface');
    roleRepository = module.get('RoleRepositoryInterface');
    userDomainService = module.get(UserDomainService);
    logHistoryUseCase = module.get(LogHistoryUseCase);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const dto: UserCreateDto = {
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'StrongPassword123!',
      roleIds: ['role1-id', 'role2-id'],
    };

    it('should create a new user successfully with roles', async () => {
      userRepository.findOneByField.mockResolvedValueOnce(null);
      userRepository.findOneByField.mockResolvedValueOnce(null);
      roleRepository.findByIds.mockResolvedValue([mockRole1, mockRole2]);
      userDomainService.createUserEntity.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      const userWithRoles = Object.assign(Object.create(User.prototype), {
        ...mockUser,
        roles: [mockRole1, mockRole2],
      });
      userRepository.findById.mockResolvedValue(userWithRoles);

      const result = await useCase.execute(dto, adminId);

      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'username',
        value: dto.username,
        disableThrow: true,
      });
      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'email',
        value: dto.email,
        disableThrow: true,
      });
      expect(roleRepository.findByIds).toHaveBeenCalledWith(dto.roleIds);
      expect(userDomainService.createUserEntity).toHaveBeenCalledWith(
        dto.username,
        dto.password,
        dto.email,
        mockRole1,
        dto.firstName,
        dto.lastName,
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [mockRole1, mockRole2],
        }),
      );
      expect(logHistoryUseCase.execute).toHaveBeenCalledWith(
        'user',
        mockUser.id,
        'CREATE',
        adminId,
      );
      expect(result).toEqual({
        ...mockUser,
        roles: [mockRole1, mockRole2],
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.ACCOUNT_CREATED,
        {
          email: mockUser.email,
          firstname: mockUser.firstName,
        },
      );
    });

    it('should create a new user without roles when roleIds is empty', async () => {
      const dtoWithoutRoles = { ...dto, roleIds: [] };

      userRepository.findOneByField.mockResolvedValueOnce(null);
      userRepository.findOneByField.mockResolvedValueOnce(null);
      userDomainService.createUserEntity.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(dtoWithoutRoles, adminId);

      expect(roleRepository.findByIds).not.toHaveBeenCalled();
      expect(userDomainService.createUserEntity).toHaveBeenCalledWith(
        dtoWithoutRoles.username,
        dtoWithoutRoles.password,
        dtoWithoutRoles.email,
        undefined,
        dtoWithoutRoles.firstName,
        dtoWithoutRoles.lastName,
      );
      expect(result).toEqual(mockUser);
    });

    it('should create a new user without roles when roleIds is undefined', async () => {
      const dtoWithoutRoles = { ...dto, roleIds: undefined };

      userRepository.findOneByField.mockResolvedValueOnce(null);
      userRepository.findOneByField.mockResolvedValueOnce(null);
      userDomainService.createUserEntity.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(dtoWithoutRoles, adminId);

      expect(roleRepository.findByIds).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw conflict error when username already exists', async () => {
      userRepository.findOneByField.mockResolvedValueOnce(mockUser);

      await expect(useCase.execute(dto, adminId)).rejects.toThrow(
        UserExceptions.conflict('username'),
      );

      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'username',
        value: dto.username,
        disableThrow: true,
      });
      expect(userRepository.findOneByField).toHaveBeenCalledTimes(1);
    });

    it('should throw conflict error when email already exists', async () => {
      userRepository.findOneByField.mockResolvedValueOnce(null);
      userRepository.findOneByField.mockResolvedValueOnce(mockUser);

      await expect(useCase.execute(dto, adminId)).rejects.toThrow(
        UserExceptions.conflict('email'),
      );

      expect(userRepository.findOneByField).toHaveBeenCalledTimes(2);
    });

    it('should throw bad request error when invalid role IDs are provided', async () => {
      userRepository.findOneByField.mockResolvedValue(null);
      roleRepository.findByIds.mockResolvedValue([mockRole1]);

      await expect(useCase.execute(dto, adminId)).rejects.toThrow(
        UserExceptions.badRequest('One or more role IDs are invalid'),
      );

      expect(roleRepository.findByIds).toHaveBeenCalledWith(dto.roleIds);
    });

    it('should assign only one role when single roleId is provided', async () => {
      const dtoWithSingleRole = { ...dto, roleIds: ['role1-id'] };

      userRepository.findOneByField.mockResolvedValue(null);
      roleRepository.findByIds.mockResolvedValue([mockRole1]);
      userDomainService.createUserEntity.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      const userWithSingleRole = Object.assign(Object.create(User.prototype), {
        ...mockUser,
        roles: [mockRole1],
      });
      userRepository.findById.mockResolvedValue(userWithSingleRole);

      const result = await useCase.execute(dtoWithSingleRole, adminId);

      expect(userDomainService.createUserEntity).toHaveBeenCalledWith(
        dtoWithSingleRole.username,
        dtoWithSingleRole.password,
        dtoWithSingleRole.email,
        mockRole1,
        dtoWithSingleRole.firstName,
        dtoWithSingleRole.lastName,
      );
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result.roles).toEqual([mockRole1]);
    });

    it('should send email event with username when firstName is not available', async () => {
      const dtoWithoutFirstName = {
        ...dto,
        firstName: undefined,
        roleIds: ['role1-id'],
      };
      const userWithoutFirstName = Object.assign(new User(), {
        ...mockUser,
        firstName: null,
      });

      userRepository.findOneByField.mockResolvedValue(null);
      roleRepository.findByIds.mockResolvedValue([mockRole1]);
      userDomainService.createUserEntity.mockResolvedValue(
        userWithoutFirstName,
      );
      userRepository.save.mockResolvedValue(userWithoutFirstName);
      userRepository.findById.mockResolvedValue(userWithoutFirstName);

      await useCase.execute(dtoWithoutFirstName, adminId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.ACCOUNT_CREATED,
        {
          email: userWithoutFirstName.email,
          firstname: userWithoutFirstName.username,
        },
      );
    });

    it('should work without logHistoryUseCase', async () => {
      const moduleWithoutHistory: TestingModule =
        await Test.createTestingModule({
          providers: [
            CreateUserByAdminUseCase,
            {
              provide: 'UserRepositoryInterface',
              useValue: userRepository,
            },
            {
              provide: 'RoleRepositoryInterface',
              useValue: roleRepository,
            },
            {
              provide: UserDomainService,
              useValue: userDomainService,
            },
            {
              provide: LogHistoryUseCase,
              useValue: undefined,
            },
            {
              provide: EventEmitter2,
              useValue: eventEmitter,
            },
          ],
        }).compile();

      const useCaseWithoutHistory =
        moduleWithoutHistory.get<CreateUserByAdminUseCase>(
          CreateUserByAdminUseCase,
        );

      userRepository.findOneByField.mockResolvedValue(null);
      roleRepository.findByIds.mockResolvedValue([mockRole1]);
      userDomainService.createUserEntity.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRepository.findById.mockResolvedValue(mockUser);

      const dtoWithSingleRole = { ...dto, roleIds: ['role1-id'] };
      const result = await useCaseWithoutHistory.execute(
        dtoWithSingleRole,
        adminId,
      );

      expect(result).toEqual(mockUser);
    });
  });
});
