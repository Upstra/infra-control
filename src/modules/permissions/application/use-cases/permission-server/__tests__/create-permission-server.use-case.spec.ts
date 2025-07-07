import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermissionServerUseCase } from '../create-permission-server.use-case';
import { PermissionDomainServerService } from '../../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../../dto/permission.server.dto';
import { PermissionServer } from '../../../../domain/entities/permission.server.entity';
import { PermissionBit } from '../../../../domain/value-objects/permission-bit.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

describe('CreatePermissionServerUseCase', () => {
  let useCase: CreatePermissionServerUseCase;
  let repository: any;
  let domainService: jest.Mocked<PermissionDomainServerService>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

  const mockPermission = (
    overrides?: Partial<PermissionServer>,
  ): PermissionServer => {
    const base: Partial<PermissionServer> = {
      roleId: 'role-123',
      serverId: 'server-456',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
      ...overrides,
    };
    return Object.setPrototypeOf(
      base,
      PermissionServer.prototype,
    ) as PermissionServer;
  };

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
    };

    const mockDomainService = {
      createPermissionEntityFromDto: jest.fn(),
    };

    const mockLogHistory = {
      executeStructured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionServerUseCase,
        {
          provide: 'PermissionServerRepositoryInterface',
          useValue: mockRepository,
        },
        {
          provide: PermissionDomainServerService,
          useValue: mockDomainService,
        },
        {
          provide: LogHistoryUseCase,
          useValue: mockLogHistory,
        },
      ],
    }).compile();

    useCase = module.get<CreatePermissionServerUseCase>(
      CreatePermissionServerUseCase,
    );
    repository = module.get('PermissionServerRepositoryInterface');
    domainService = module.get(PermissionDomainServerService);
    logHistory = module.get(LogHistoryUseCase);
  });

  describe('execute', () => {
    it('should create permission successfully', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      });

      const entity = mockPermission();
      const savedEntity = mockPermission();

      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await useCase.execute(dto, 'user-789');

      expect(domainService.createPermissionEntityFromDto).toHaveBeenCalledWith(
        dto,
      );
      expect(repository.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(new PermissionServerDto(savedEntity));
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'permission_server',
        entityId: 'server-456_role-123',
        action: 'CREATE',
        userId: 'user-789',
        newValue: {
          serverId: savedEntity.serverId,
          roleId: savedEntity.roleId,
          bitmask: savedEntity.bitmask,
        },
        metadata: {
          permissionType: 'server',
        },
      });
    });

    it('should create permission without userId', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      const entity = mockPermission({ bitmask: PermissionBit.READ });
      const savedEntity = mockPermission({ bitmask: PermissionBit.READ });

      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await useCase.execute(dto);

      expect(result).toEqual(new PermissionServerDto(savedEntity));
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'permission_server',
        entityId: 'server-456_role-123',
        action: 'CREATE',
        userId: 'system',
        newValue: {
          serverId: savedEntity.serverId,
          roleId: savedEntity.roleId,
          bitmask: savedEntity.bitmask,
        },
        metadata: {
          permissionType: 'server',
        },
      });
    });

    it('should handle different bitmask values', async () => {
      const testCases = [
        { bitmask: 0 },
        { bitmask: PermissionBit.READ },
        { bitmask: PermissionBit.WRITE },
        { bitmask: PermissionBit.DELETE },
        {
          bitmask:
            PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE,
        },
        { bitmask: 255 },
      ];

      for (const testCase of testCases) {
        const dto = new PermissionServerDto({
          roleId: 'role-123',
          serverId: 'server-456',
          bitmask: testCase.bitmask,
        });

        const entity = mockPermission({ bitmask: testCase.bitmask });
        const savedEntity = mockPermission({ bitmask: testCase.bitmask });

        domainService.createPermissionEntityFromDto.mockReturnValue(entity);
        repository.save.mockResolvedValue(savedEntity);

        const result = await useCase.execute(dto, 'user-789');

        expect(result.bitmask).toBe(testCase.bitmask);
      }
    });

    it('should throw error when domain service fails', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      domainService.createPermissionEntityFromDto.mockImplementation(() => {
        throw new Error('Domain service error');
      });

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Domain service error',
      );
      expect(repository.save).not.toHaveBeenCalled();
      expect(logHistory.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw error when repository save fails', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      const entity = mockPermission();

      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(dto)).rejects.toThrow('Database error');
      expect(logHistory.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw error when logging fails', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      const entity = mockPermission();
      const savedEntity = mockPermission();

      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockResolvedValue(savedEntity);
      logHistory.executeStructured.mockRejectedValue(
        new Error('Logging failed'),
      );

      // Logging failures propagate
      await expect(useCase.execute(dto)).rejects.toThrow('Logging failed');
    });

    it('should work without LogHistoryUseCase', async () => {
      const mockRepositoryWithoutLogging = {
        save: jest.fn(),
      };

      const mockDomainServiceWithoutLogging = {
        createPermissionEntityFromDto: jest.fn(),
      };

      const moduleWithoutLogging: TestingModule =
        await Test.createTestingModule({
          providers: [
            CreatePermissionServerUseCase,
            {
              provide: 'PermissionServerRepositoryInterface',
              useValue: mockRepositoryWithoutLogging,
            },
            {
              provide: PermissionDomainServerService,
              useValue: mockDomainServiceWithoutLogging,
            },
            {
              provide: LogHistoryUseCase,
              useValue: undefined,
            },
          ],
        }).compile();

      const useCaseWithoutLogging =
        moduleWithoutLogging.get<CreatePermissionServerUseCase>(
          CreatePermissionServerUseCase,
        );

      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      const entity = mockPermission();
      const savedEntity = mockPermission();

      mockDomainServiceWithoutLogging.createPermissionEntityFromDto.mockReturnValue(
        entity,
      );
      mockRepositoryWithoutLogging.save.mockResolvedValue(savedEntity);

      const result = await useCaseWithoutLogging.execute(dto);

      expect(result).toEqual(new PermissionServerDto(savedEntity));
    });

    it('should handle undefined values in saved entity', async () => {
      const dto = new PermissionServerDto({
        roleId: 'role-123',
        serverId: 'server-456',
        bitmask: PermissionBit.READ,
      });

      const entity = mockPermission();
      const savedEntity = mockPermission({
        roleId: undefined,
        serverId: undefined,
        bitmask: 0,
      });

      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await useCase.execute(dto);

      expect(result.roleId).toBeUndefined();
      expect(result.serverId).toBeUndefined();
      expect(result.bitmask).toBe(0);
    });
  });
});
