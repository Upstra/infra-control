import { Test, TestingModule } from '@nestjs/testing';
import { CreateBatchPermissionServerUseCase } from '../create-batch-permission-server.use-case';
import { PermissionDomainServerService } from '../../../../domain/services/permission.domain.server.service';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { BatchPermissionServerDto } from '../../../dto/batch-permission.server.dto';
import { PermissionServer } from '../../../../domain/entities/permission.server.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

describe('CreateBatchPermissionServerUseCase', () => {
  let useCase: CreateBatchPermissionServerUseCase;
  let repository: jest.Mocked<PermissionServerRepositoryInterface>;
  let domainService: jest.Mocked<PermissionDomainServerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBatchPermissionServerUseCase,
        {
          provide: 'PermissionServerRepositoryInterface',
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: PermissionDomainServerService,
          useValue: {
            createPermissionEntityFromDto: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateBatchPermissionServerUseCase>(
      CreateBatchPermissionServerUseCase,
    );
    repository = module.get('PermissionServerRepositoryInterface');
    domainService = module.get(PermissionDomainServerService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully create all permissions', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          serverId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
      ];

      const entities = [new PermissionServer(), new PermissionServer()];
      entities[0].roleId = dto.permissions[0].roleId;
      entities[0].serverId = dto.permissions[0].serverId;
      entities[0].bitmask = dto.permissions[0].bitmask;
      entities[1].roleId = dto.permissions[1].roleId;
      entities[1].serverId = dto.permissions[1].serverId;
      entities[1].bitmask = dto.permissions[1].bitmask;

      domainService.createPermissionEntityFromDto
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);

      repository.save
        .mockResolvedValueOnce(entities[0])
        .mockResolvedValueOnce(entities[1]);

      const result = await useCase.execute(dto);

      expect(result.total).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(domainService.createPermissionEntityFromDto).toHaveBeenCalledTimes(
        2,
      );
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          serverId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
      ];

      const entity = new PermissionServer();
      entity.roleId = dto.permissions[0].roleId;
      entity.serverId = dto.permissions[0].serverId;
      entity.bitmask = dto.permissions[0].bitmask;

      domainService.createPermissionEntityFromDto
        .mockReturnValueOnce(entity)
        .mockImplementationOnce(() => {
          throw new Error('Invalid permission');
        });

      repository.save.mockResolvedValueOnce(entity);

      const result = await useCase.execute(dto);

      expect(result.total).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Invalid permission');
      expect(result.failed[0].permission).toEqual(dto.permissions[1]);
    });

    it('should handle all failures', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      domainService.createPermissionEntityFromDto.mockImplementation(() => {
        throw new Error('Domain validation failed');
      });

      const result = await useCase.execute(dto);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.created).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Domain validation failed');
    });

    it('should handle repository save errors', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      const entity = new PermissionServer();
      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(dto);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toBe('Database error');
    });

    it('should handle unknown errors gracefully', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      domainService.createPermissionEntityFromDto.mockImplementation(() => {
        throw {};
      });

      const result = await useCase.execute(dto);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toBe('Unknown error occurred');
    });

    it('should process permissions sequentially', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          serverId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174004',
          serverId: '123e4567-e89b-12d3-a456-426614174005',
          bitmask: 3,
        },
      ];

      const callOrder: string[] = [];

      domainService.createPermissionEntityFromDto.mockImplementation((dto) => {
        callOrder.push(`create-${dto.roleId}`);
        const entity = new PermissionServer();
        Object.assign(entity, dto);
        return entity;
      });

      repository.save.mockImplementation(async (entity) => {
        callOrder.push(`save-${entity.roleId}`);
        return entity;
      });

      await useCase.execute(dto);

      expect(callOrder).toEqual([
        'create-123e4567-e89b-12d3-a456-426614174000',
        'save-123e4567-e89b-12d3-a456-426614174000',
        'create-123e4567-e89b-12d3-a456-426614174002',
        'save-123e4567-e89b-12d3-a456-426614174002',
        'create-123e4567-e89b-12d3-a456-426614174004',
        'save-123e4567-e89b-12d3-a456-426614174004',
      ]);
    });
  });
});
