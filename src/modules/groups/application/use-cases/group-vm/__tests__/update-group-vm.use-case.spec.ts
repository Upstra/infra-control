import { UpdateGroupVmUseCase } from '../update-group-vm.use-case';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';

describe('UpdateGroupVmUseCase', () => {
  let useCase: UpdateGroupVmUseCase;
  let repo: jest.Mocked<GroupVmRepositoryInterface>;
  let domain: jest.Mocked<GroupVmDomainService>;

  beforeEach(() => {
    repo = {
      findGroupById: jest.fn(),
      save: jest.fn(),
    } as any;

    domain = {
      updateGroupEntityFromDto: jest.fn(),
    } as any;

    useCase = new UpdateGroupVmUseCase(repo, domain);
  });

  it('should update the group with new values and return DTO', async () => {
    const existing = createMockGroupVm();
    const inputDto: GroupVmDto = { name: 'NewName', priority: 5 };
    const updatedEntity = createMockGroupVm({ name: 'NewName', priority: 5 });

    repo.findGroupById.mockResolvedValue(existing);
    domain.updateGroupEntityFromDto.mockImplementation((entity, dto) => {
      entity.name = dto.name;
      entity.priority = dto.priority;
      return entity;
    });
    repo.save.mockResolvedValue(updatedEntity);

    const result = await useCase.execute('groupvm-1', inputDto);

    expect(repo.findGroupById).toHaveBeenCalledWith('groupvm-1');
    expect(domain.updateGroupEntityFromDto).toHaveBeenCalledWith(
      existing,
      inputDto,
    );
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(result).toEqual(new GroupVmDto(updatedEntity));
  });

  it('should throw if the group does not exist', async () => {
    repo.findGroupById.mockResolvedValue(null);

    await expect(
      useCase.execute('notfound-id', { name: 'irrelevant' }),
    ).rejects.toThrow(GroupNotFoundException);
  });
});
