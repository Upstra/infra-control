import { UnauthorizedException } from '@nestjs/common';
import { GetUserVmPermissionsUseCase } from '../get-user-permission-vm-use-case';

describe('GetUserVmPermissionsUseCase', () => {
  let useCase: GetUserVmPermissionsUseCase;
  let userRepo: any;
  let permissionVmRepo: any;

  beforeEach(() => {
    userRepo = { findOneByField: jest.fn() };
    permissionVmRepo = { findAllByField: jest.fn() };
    useCase = new GetUserVmPermissionsUseCase(userRepo, permissionVmRepo);
  });

  it("should return VM permissions for the user's role", async () => {
    const fakeUser = { id: '1', roles: [{ id: 'role-123' }] };
    const fakePermissions = [{ id: 'perm1' }, { id: 'perm2' }];
    userRepo.findOneByField.mockResolvedValue(fakeUser);
    permissionVmRepo.findAllByField.mockResolvedValue(fakePermissions);

    const fromEntitiesSpy = jest
      .spyOn(
        require('../../../dto/permission.vm.dto').PermissionVmDto,
        'fromEntities',
      )
      .mockReturnValue(['dto1', 'dto2']);

    const result = await useCase.execute('1');

    expect(result).toEqual(['dto1', 'dto2']);
    expect(fromEntitiesSpy).toHaveBeenCalledWith(expect.any(Array));
  });

  it('should throw UnauthorizedException if user has no role', async () => {
    userRepo.findOneByField.mockResolvedValue({ id: '1', roles: [] });
    await expect(useCase.execute('1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    userRepo.findOneByField.mockResolvedValue(null);
    await expect(useCase.execute('1')).rejects.toThrow(UnauthorizedException);
  });

  it('should return empty array if no permissions found', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: '1',
      roles: [{ id: 'role-123' }],
    });
    permissionVmRepo.findAllByField.mockResolvedValue([]);
    jest
      .spyOn(
        require('../../../dto/permission.vm.dto').PermissionVmDto,
        'fromEntities',
      )
      .mockReturnValue([]);

    const result = await useCase.execute('1');
    expect(result).toEqual([]);
  });

  it('should propagate error if permissionVmRepo.findAllByField throws', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: '1',
      roles: [{ id: 'role-123' }],
    });
    permissionVmRepo.findAllByField.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute('1')).rejects.toThrow('DB Error');
  });
});
