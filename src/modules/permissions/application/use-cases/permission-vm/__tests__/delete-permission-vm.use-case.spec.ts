import { Test } from '@nestjs/testing';
import { DeletePermissionVmUseCase } from '../delete-permission-vm.use-case';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { createMockPermissionVm } from '@/modules/permissions/__mocks__/permissions.mock';

describe('DeletePermissionVmUseCase', () => {
  let useCase: DeletePermissionVmUseCase;
  let repository: jest.Mocked<PermissionVmRepositoryInterface>;

  beforeEach(async () => {
    const repositoryMock = {
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      updatePermission: jest.fn(),
      findPermissionByIds: jest.fn(),
      findAllByField: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeletePermissionVmUseCase,
        {
          provide: 'PermissionVmRepositoryInterface',
          useValue: repositoryMock,
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get<DeletePermissionVmUseCase>(
      DeletePermissionVmUseCase,
    );
    repository = moduleRef.get('PermissionVmRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should call repository delete with correct parameters and log history', async () => {
      const vmId = 'test-vm-id';
      const roleId = 'test-role-id';
      const userId = 'test-user-id';
      const mockPermission = createMockPermissionVm();

      repository.findPermissionByIds.mockResolvedValue(mockPermission);
      repository.deletePermission.mockResolvedValue(undefined);

      await useCase.execute(vmId, roleId, userId);

      expect(repository.findPermissionByIds).toHaveBeenCalledWith(vmId, roleId);
      expect(repository.deletePermission).toHaveBeenCalledWith(vmId, roleId);
      expect(repository.deletePermission).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const vmId = 'test-vm-id';
      const roleId = 'test-role-id';
      const mockPermission = createMockPermissionVm();
      const error = new Error('Repository error');

      repository.findPermissionByIds.mockResolvedValue(mockPermission);
      repository.deletePermission.mockRejectedValueOnce(error);

      await expect(useCase.execute(vmId, roleId)).rejects.toThrow(error);
    });
  });
});
