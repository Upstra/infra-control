import { CreateVmUseCase } from '../create-vm.use-case';
import { VmDomainService } from '@/modules/vms/domain/services/vm.domain.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { VmResponseDto } from '@/modules/vms/application/dto/vm.response.dto';
import { createMockVmDto } from '@/modules/vms/__mocks__/vms.mock';

describe('CreateVmUseCase', () => {
  let useCase: CreateVmUseCase;
  let domain: jest.Mocked<VmDomainService>;
  let repo: jest.Mocked<VmRepositoryInterface>;

  beforeEach(() => {
    domain = {
      createVmEntity: jest.fn(),
    } as any;

    repo = {
      save: jest.fn(),
    } as any;

    useCase = new CreateVmUseCase(repo, domain);
  });

  it('should create and return a VM response DTO', async () => {
    const dto = createMockVmDto();
    const vmEntity = new Vm();
    const savedVm = Object.assign(new Vm(), dto);

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);

    const result = await useCase.execute(dto);

    expect(domain.createVmEntity).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(vmEntity);
    expect(result).toBeInstanceOf(VmResponseDto);
    expect(result.id).toBe(savedVm.id);
  });

  it('should pass through VM properties correctly', async () => {
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

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);

    const result = await useCase.execute(dto);

    expect(result.id).toBe('vm-123');
    expect(result.name).toBe('test-vm');
    expect(result.state).toBe('running');
    expect(result.os).toBe('Ubuntu 22.04');
    expect(result.ip).toBe('192.168.1.100');
    expect(result.serverId).toBe('server-456');
    expect(result.priority).toBe(1);
    expect(result.groupId).toBe('group-123');
  });

  it('should handle domain errors', async () => {
    const dto = createMockVmDto();
    const error = new Error('Invalid VM configuration');

    domain.createVmEntity.mockImplementation(() => {
      throw error;
    });

    await expect(useCase.execute(dto)).rejects.toThrow(error);
  });

  it('should handle repository errors', async () => {
    const dto = createMockVmDto();
    const vmEntity = new Vm();
    const error = new Error('Database error');

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockRejectedValue(error);

    await expect(useCase.execute(dto)).rejects.toThrow(error);
  });

  it('should create VM without optional fields', async () => {
    const dto = {
      ...createMockVmDto(),
      groupId: undefined,
      description: undefined,
    };
    const vmEntity = new Vm();
    const savedVm = Object.assign(new Vm(), {
      ...dto,
      id: 'vm-456',
      groupId: null,
      description: null,
    });

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);

    const result = await useCase.execute(dto);

    expect(result.groupId).toBeNull();
  });
});
