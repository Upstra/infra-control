import { UpdateServerUseCase } from '../update-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UpdateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerUpdateDto } from '../../dto/server.update.dto';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilo.mock';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.exception';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { GroupTypeMismatchException } from '@/modules/groups/domain/exceptions/group-type-mismatch.exception';
import { GroupType } from '@/modules/groups/domain/enums/group-type.enum';

describe('UpdateServerUseCase', () => {
  let useCase: UpdateServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let updateIlo: jest.Mocked<UpdateIloUseCase>;
  let groupRepo: jest.Mocked<GroupRepository>;

  beforeEach(() => {
    repo = {
      findServerById: jest.fn(),
      save: jest.fn(),
      updateServer: jest.fn(),
    } as any;

    updateIlo = {
      execute: jest.fn(),
    } as any;

    groupRepo = {
      findById: jest.fn(),
    } as any;

    useCase = new UpdateServerUseCase(repo, updateIlo, groupRepo);
  });

  it('should update the server and its ILO', async () => {
    const dto: ServerUpdateDto = {
      name: 'Updated',
      ilo: { ip: '10.0.0.2', name: 'ILO-2' },
    };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'Updated', iloId: 'ilo-123' });

    repo.updateServer.mockResolvedValue(updated);
    updateIlo.execute.mockResolvedValue(createMockIlo({ name: 'ILO-2' }));

    const result = await useCase.execute(existing.id, dto);

    expect(repo.updateServer).toHaveBeenCalledWith(existing.id, {
      name: 'Updated',
    });
    expect(updateIlo.execute).toHaveBeenCalledWith({
      ...dto.ilo,
      id: updated.iloId,
    });
    expect(result.name).toBe('Updated');
    expect(result.ilo.name).toBe('ILO-2');
  });

  it('should skip ILO update if not present in dto', async () => {
    const dto: ServerUpdateDto = { name: 'NoILO' };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'NoILO' });
    repo.updateServer.mockResolvedValue(updated);

    const result = await useCase.execute(existing.id, dto);

    expect(updateIlo.execute).not.toHaveBeenCalled();
    expect(result.name).toBe('NoILO');
  });

  it('should throw if server is not found', async () => {
    repo.updateServer.mockRejectedValue(
      new ServerNotFoundException('not-found'),
    );

    await expect(useCase.execute('not-found', {})).rejects.toThrow(
      ServerNotFoundException,
    );
  });

  it('should allow assigning server to a SERVER type group', async () => {
    const dto: ServerUpdateDto = {
      groupId: 'group-123',
    };
    const existing = createMockServer();
    const updated = createMockServer({ groupId: 'group-123' });
    const serverGroup = {
      id: 'group-123',
      type: GroupType.SERVER,
      name: 'Server Group',
    };

    groupRepo.findById.mockResolvedValue(serverGroup as any);
    repo.updateServer.mockResolvedValue(updated);

    const result = await useCase.execute(existing.id, dto);

    expect(groupRepo.findById).toHaveBeenCalledWith('group-123');
    expect(result.groupId).toBe('group-123');
  });

  it('should throw when trying to assign server to a VM type group', async () => {
    const dto: ServerUpdateDto = {
      groupId: 'vm-group-123',
    };
    const existing = createMockServer();
    const vmGroup = {
      id: 'vm-group-123',
      type: GroupType.VM,
      name: 'VM Group',
    };

    groupRepo.findById.mockResolvedValue(vmGroup as any);

    await expect(useCase.execute(existing.id, dto)).rejects.toThrow(
      GroupTypeMismatchException,
    );
    expect(groupRepo.findById).toHaveBeenCalledWith('vm-group-123');
  });

  it('should skip group validation when groupId is not provided', async () => {
    const dto: ServerUpdateDto = {
      name: 'Updated',
    };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'Updated' });

    repo.updateServer.mockResolvedValue(updated);

    await useCase.execute(existing.id, dto);

    expect(groupRepo.findById).not.toHaveBeenCalled();
  });

  it('should allow removing group by setting groupId to null', async () => {
    const dto: ServerUpdateDto = {
      groupId: null,
    };
    const existing = createMockServer({ groupId: 'old-group-123' });
    const updated = createMockServer({ groupId: null });

    repo.updateServer.mockResolvedValue(updated);

    const result = await useCase.execute(existing.id, dto);

    expect(groupRepo.findById).not.toHaveBeenCalled();
    expect(result.groupId).toBeNull();
  });

  it('should skip ILO update if server has no ILO associated', async () => {
    const dto: ServerUpdateDto = {
      name: 'Updated',
      ilo: { ip: '10.0.0.2', name: 'ILO-2' },
    };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'Updated', iloId: null });

    repo.updateServer.mockResolvedValue(updated);

    const result = await useCase.execute(existing.id, dto);

    expect(updateIlo.execute).not.toHaveBeenCalled();
    expect(result.name).toBe('Updated');
  });
});
