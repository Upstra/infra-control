import { CreateReadOnlyPermissionServerUseCase } from '../create-readonly-permission-server.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionDomainServerService } from '@/modules/permissions/domain/services/permission.domain.server.service';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('CreateReadOnlyPermissionServerUseCase', () => {
  let useCase: CreateReadOnlyPermissionServerUseCase;
  let domainService: jest.Mocked<PermissionDomainServerService>;
  let repository: jest.Mocked<PermissionServerRepository>;

  const mockPermission = (
    overrides?: Partial<PermissionServer>,
  ): PermissionServer => {
    const base: Partial<PermissionServer> = {
      roleId: 'role-1',
      serverId: 'server-1',
      bitmask: PermissionBit.READ,
      ...overrides,
    };
    return Object.setPrototypeOf(
      base,
      PermissionServer.prototype,
    ) as PermissionServer;
  };

  beforeEach(() => {
    domainService = {
      createReadOnlyPermissionEntity: jest.fn(),
      createFullPermissionEntity: jest.fn(),
      createPermissionEntityFromDto: jest.fn(),
    } as any;

    repository = {
      save: jest.fn(),
    } as any;

    useCase = new CreateReadOnlyPermissionServerUseCase(
      repository,
      domainService,
    );
  });

  it('should create and return a readonly permission dto', async () => {
    const entity = mockPermission();
    domainService.createReadOnlyPermissionEntity.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await useCase.execute();

    expect(domainService.createReadOnlyPermissionEntity).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(PermissionServerDto.fromEntity(entity));
  });

  it('should throw if repository.save fails', async () => {
    const entity = mockPermission();
    domainService.createReadOnlyPermissionEntity.mockReturnValue(entity);
    repository.save.mockRejectedValue(new Error('DB fail'));

    await expect(useCase.execute()).rejects.toThrow('DB fail');
  });

  it('should map saved entity with read only flag set', async () => {
    const saved = mockPermission({
      bitmask: PermissionBit.READ,
    });

    domainService.createReadOnlyPermissionEntity.mockReturnValue(saved);
    repository.save.mockResolvedValue(saved);

    const result = await useCase.execute();

    expect(result.bitmask).toBe(PermissionBit.READ);
  });
});
