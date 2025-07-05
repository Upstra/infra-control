import { CreateVmUseCase } from '../create-vm.use-case';
import { VmDomainService } from '@/modules/vms/domain/services/vm.domain.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { VmResponseDto } from '@/modules/vms/application/dto/vm.response.dto';
import { createMockVmDto } from '@/modules/vms/__mocks__/vms.mock';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { mockRoom } from '@/modules/rooms/__mocks__/room.mock';

describe('CreateVmUseCase', () => {
  let useCase: CreateVmUseCase;
  let domain: jest.Mocked<VmDomainService>;
  let repo: jest.Mocked<VmRepositoryInterface>;
  let serverRepo: jest.Mocked<ServerRepositoryInterface>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

  beforeEach(() => {
    domain = {
      createVmEntity: jest.fn(),
    } as any;

    repo = {
      save: jest.fn(),
    } as any;

    serverRepo = {
      findOneByField: jest.fn(),
    } as any;

    logHistory = {
      execute: jest.fn(),
      executeStructured: jest.fn(),
    } as any;

    useCase = new CreateVmUseCase(repo, domain, serverRepo, logHistory);
  });

  it('should create and return a VM response DTO', async () => {
    const dto = createMockVmDto();
    const vmEntity = new Vm();
    const savedVm = Object.assign(new Vm(), dto);

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);
    serverRepo.findOneByField.mockResolvedValue(createMockServer());

    const result = await useCase.execute(dto);

    expect(domain.createVmEntity).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(vmEntity);
    expect(result).toBeInstanceOf(VmResponseDto);
    expect(result.name).toBe(dto.name);
  });

  it('should handle missing optional groupId', async () => {
    const dto = { ...createMockVmDto(), groupId: undefined };
    const vmEntity = new Vm();
    const savedVm = Object.assign(new Vm(), dto);

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);
    serverRepo.findOneByField.mockResolvedValue(createMockServer());

    const result = await useCase.execute(dto);
    expect(result.groupId).toBeUndefined();
  });

  it('should throw if repo.save fails', async () => {
    const dto = createMockVmDto();
    const vmEntity = new Vm();

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockRejectedValue(new Error('DB error'));
    serverRepo.findOneByField.mockResolvedValue(createMockServer());

    await expect(useCase.execute(dto)).rejects.toThrow('DB error');
  });

  describe('Structured Logging', () => {
    const requestContext = RequestContextDto.forTesting({
      ipAddress: '192.168.100.1',
      userAgent: 'VM-Manager/3.0',
    });

    it('should log VM creation with structured data', async () => {
      const dto = createMockVmDto();
      const vmEntity = new Vm();
      const savedVm = Object.assign(new Vm(), {
        ...dto,
        id: 'vm-123',
        name: 'test-vm',
        state: 'running',
        os: 'Ubuntu 22.04',
        ip: '192.168.1.100',
        serverId: 'server-456',
        priority: 1,
        groupId: 'group-123',
      });
      const mockServer = createMockServer({
        name: 'test-server',
        roomId: 'room-789',
        room: mockRoom({ name: 'Production Room' }),
      });

      domain.createVmEntity.mockReturnValue(vmEntity);
      repo.save.mockResolvedValue(savedVm);
      serverRepo.findOneByField.mockResolvedValue(mockServer);

      await useCase.execute(dto, 'user-123', requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'vm',
        entityId: savedVm.id,
        action: 'CREATE',
        userId: 'user-123',
        newValue: {
          name: savedVm.name,
          state: savedVm.state,
          os: savedVm.os,
          ip: savedVm.ip,
          serverId: savedVm.serverId,
          serverHostname: mockServer.name,
          roomId: mockServer.roomId,
          roomName: mockServer.room.name,
          priority: savedVm.priority,
          groupId: savedVm.groupId,
        },
        metadata: {
          vmType: 'virtual',
          operatingSystem: savedVm.os,
          parentServer: mockServer.name,
          createdOnServer: savedVm.serverId,
          assignedToGroup: !!savedVm.groupId,
          priority: savedVm.priority,
        },
        ipAddress: '192.168.100.1',
        userAgent: 'VM-Manager/3.0',
      });
    });

    it('should log VM creation without group assignment', async () => {
      const dto = { ...createMockVmDto(), groupId: undefined };
      const vmEntity = new Vm();
      const savedVm = Object.assign(new Vm(), {
        ...dto,
        id: 'vm-456',
        groupId: null,
      });
      const mockServer = createMockServer({ room: null });

      domain.createVmEntity.mockReturnValue(vmEntity);
      repo.save.mockResolvedValue(savedVm);
      serverRepo.findOneByField.mockResolvedValue(mockServer);

      await useCase.execute(dto, 'user-123', requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            assignedToGroup: false,
          }),
          newValue: expect.objectContaining({
            groupId: null,
            roomName: undefined,
          }),
        }),
      );
    });

    it('should work without request context', async () => {
      const dto = createMockVmDto();
      const vmEntity = new Vm();
      const savedVm = Object.assign(new Vm(), dto);

      domain.createVmEntity.mockReturnValue(vmEntity);
      repo.save.mockResolvedValue(savedVm);
      serverRepo.findOneByField.mockResolvedValue(createMockServer());

      await useCase.execute(dto, 'user-123');

      expect(logHistory.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });
  });
});
