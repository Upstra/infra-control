import { CreateFullPermissionServerUseCase } from '../create-full-permission-server.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionDomainServerService } from '@/modules/permissions/domain/services/permission.domain.server.service';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('CreateFullPermissionServerUseCase', () => {
  let useCase: CreateFullPermissionServerUseCase;
  let domainService: jest.Mocked<PermissionDomainServerService>;
  let repository: jest.Mocked<PermissionServerRepository>;

  const mockPermission = (
    overrides?: Partial<PermissionServer>,
  ): PermissionServer => {
    const base: Partial<PermissionServer> = {
      roleId: 'role-1',
      serverId: 'server-1',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
      ...overrides,
    };
    return Object.setPrototypeOf(
      base,
      PermissionServer.prototype,
    ) as PermissionServer;
  };

  beforeEach(() => {
    domainService = {
      createFullPermissionEntity: jest.fn(),
      createReadOnlyPermissionEntity: jest.fn(),
      createPermissionEntityFromDto: jest.fn(),
    } as any;

    repository = {
      save: jest.fn(),
    } as any;

    useCase = new CreateFullPermissionServerUseCase(repository, domainService);
  });

  it('should create and return a full permission dto', async () => {
    const entity = mockPermission();
    domainService.createFullPermissionEntity.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await useCase.execute();

    expect(domainService.createFullPermissionEntity).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(PermissionServerDto.fromEntity(entity));
  });

  it('should throw if repository.save fails', async () => {
    const entity = mockPermission();
    domainService.createFullPermissionEntity.mockReturnValue(entity);
    repository.save.mockRejectedValue(new Error('DB failed'));

    await expect(useCase.execute()).rejects.toThrow('DB failed');
  });

  it('should correctly map saved entity to dto', async () => {
    const saved = mockPermission({
      roleId: 'custom-role',
      serverId: 'custom-server',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    domainService.createFullPermissionEntity.mockReturnValue(saved);
    repository.save.mockResolvedValue(saved);

    const result = await useCase.execute();

    expect(result).toEqual({
      roleId: 'custom-role',
      serverId: 'custom-server',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });
  });
});
