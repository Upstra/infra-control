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
    expect(result.name).toBe(dto.name);
  });

  it('should handle missing optional groupId', async () => {
    const dto = { ...createMockVmDto(), groupId: undefined };
    const vmEntity = new Vm();
    const savedVm = Object.assign(new Vm(), dto);

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockResolvedValue(savedVm);

    const result = await useCase.execute(dto);
    expect(result.groupId).toBeUndefined();
  });

  it('should throw if repo.save fails', async () => {
    const dto = createMockVmDto();
    const vmEntity = new Vm();

    domain.createVmEntity.mockReturnValue(vmEntity);
    repo.save.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB error');
  });
});
