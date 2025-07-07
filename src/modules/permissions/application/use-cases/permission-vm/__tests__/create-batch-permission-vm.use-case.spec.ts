import { Test, TestingModule } from '@nestjs/testing';
import { CreateBatchPermissionVmUseCase } from '../create-batch-permission-vm.use-case';
import { PermissionDomainVmService } from '../../../../domain/services/permission.domain.vm.service';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { BatchPermissionVmDto } from '../../../dto/batch-permission.vm.dto';
import { PermissionVm } from '../../../../domain/entities/permission.vm.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

describe('CreateBatchPermissionVmUseCase', () => {
  let useCase: CreateBatchPermissionVmUseCase;
  let repository: jest.Mocked<PermissionVmRepositoryInterface>;
  let domainService: jest.Mocked<PermissionDomainVmService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBatchPermissionVmUseCase,
        {
          provide: 'PermissionVmRepositoryInterface',
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: PermissionDomainVmService,
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

    useCase = module.get<CreateBatchPermissionVmUseCase>(
      CreateBatchPermissionVmUseCase,
    );
    repository = module.get('PermissionVmRepositoryInterface');
    domainService = module.get(PermissionDomainVmService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully create all permissions', async () => {
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          vmId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
      ];

      const entities = [new PermissionVm(), new PermissionVm()];
      entities[0].roleId = dto.permissions[0].roleId;
      entities[0].vmId = dto.permissions[0].vmId;
      entities[0].bitmask = dto.permissions[0].bitmask;
      entities[1].roleId = dto.permissions[1].roleId;
      entities[1].vmId = dto.permissions[1].vmId;
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
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          vmId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
      ];

      const entity = new PermissionVm();
      entity.roleId = dto.permissions[0].roleId;
      entity.vmId = dto.permissions[0].vmId;
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
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
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
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      const entity = new PermissionVm();
      domainService.createPermissionEntityFromDto.mockReturnValue(entity);
      repository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(dto);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toBe('Database error');
    });

    it('should handle unknown errors gracefully', async () => {
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
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

    it('should handle string errors', async () => {
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      domainService.createPermissionEntityFromDto.mockImplementation(() => {
        throw 'String error message';
      });

      const result = await useCase.execute(dto);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toBe('String error message');
    });

    it('should handle null and undefined errors', async () => {
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          vmId: '123e4567-e89b-12d3-a456-426614174002',
          bitmask: 7,
        },
      ];

      domainService.createPermissionEntityFromDto
        .mockImplementationOnce(() => {
          throw null;
        })
        .mockImplementationOnce(() => {
          throw undefined;
        });

      const result = await useCase.execute(dto);

      expect(result.total).toBe(2);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
      expect(result.failed[0].error).toBe('Unknown error occurred');
      expect(result.failed[1].error).toBe('Unknown error occurred');
    });

    it('should process permissions sequentially', async () => {
      const dto = new BatchPermissionVmDto();
      dto.permissions = [
        {
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          vmId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174002',
          vmId: '123e4567-e89b-12d3-a456-426614174003',
          bitmask: 7,
        },
        {
          roleId: '123e4567-e89b-12d3-a456-426614174004',
          vmId: '123e4567-e89b-12d3-a456-426614174005',
          bitmask: 3,
        },
      ];

      const callOrder: string[] = [];

      domainService.createPermissionEntityFromDto.mockImplementation((dto) => {
        callOrder.push(`create-${dto.roleId}`);
        const entity = new PermissionVm();
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
