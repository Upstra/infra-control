import { CreateGroupVmUseCase } from '../create-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';
import { GroupVmDto } from '../../../dto/group.vm.dto';

describe('CreateGroupVmUseCase', () => {
  let useCase: CreateGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;
  let domain: jest.Mocked<GroupVmDomainService>;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
    } as any;

    domain = {
      createGroup: jest.fn(),
    } as any;

    useCase = new CreateGroupVmUseCase(repo, domain);
  });

  it('should create a GroupVm and return the DTO', async () => {
    const inputDto: GroupVmDto = {
      name: 'Group VM Test',
      priority: 1,
      serverGroupId: 'server-group-123',
    };

    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    const createdEntity = Object.assign(new GroupVm(), entity, {
      id: 'group-123',
    });

    domain.createGroup.mockReturnValue(entity);
    repo.save.mockResolvedValue(createdEntity);

    const result = await useCase.execute(inputDto);

    expect(domain.createGroup).toHaveBeenCalledWith(inputDto);
    expect(repo.save).toHaveBeenCalledWith(entity);

    expect(result).toEqual(
      expect.objectContaining({
        name: inputDto.name,
        priority: inputDto.priority,
        vmIds: [],
      }),
    );
  });

  it('should throw if repo.save throws', async () => {
    const inputDto: GroupVmDto = {
      name: 'fail',
      priority: 2,
      serverGroupId: 'server-group-456',
    };
    const entity = new GroupVm();
    entity.name = inputDto.name;
    entity.priority = inputDto.priority;
    entity.vms = [];

    domain.createGroup.mockReturnValue(entity);
    repo.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(inputDto)).rejects.toThrow('DB Error');
  });
});
