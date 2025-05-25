import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerController } from '../permission.server.controller';

import { createMockPermissionServerDto } from '@/modules/permissions/__mocks__/permissions.mock';
import {
  CreatePermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetPermissionServerByIdsUseCase,
  GetPermissionsServerByRoleUseCase,
  UpdatePermissionServerUseCase,
} from '../../use-cases/permission-server';

describe('PermissionServerController', () => {
  let controller: PermissionServerController;
  let createPermissionUsecase: any;
  let getAllByRoleUsecase: any;
  let getByIdsUsecase: any;
  let updatePermissionUsecase: any;
  let deletePermissionUsecase: any;

  beforeEach(async () => {
    createPermissionUsecase = { execute: jest.fn() };
    getAllByRoleUsecase = { execute: jest.fn() };
    getByIdsUsecase = { execute: jest.fn() };
    updatePermissionUsecase = { execute: jest.fn() };
    deletePermissionUsecase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionServerController],
      providers: [
        {
          provide: CreatePermissionServerUseCase,
          useValue: createPermissionUsecase,
        },
        {
          provide: GetPermissionsServerByRoleUseCase,
          useValue: getAllByRoleUsecase,
        },
        { provide: GetPermissionServerByIdsUseCase, useValue: getByIdsUsecase },
        {
          provide: UpdatePermissionServerUseCase,
          useValue: updatePermissionUsecase,
        },
        {
          provide: DeletePermissionServerUseCase,
          useValue: deletePermissionUsecase,
        },
      ],
    }).compile();

    controller = module.get<PermissionServerController>(
      PermissionServerController,
    );
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createPermission', async () => {
    const dto = createMockPermissionServerDto();
    createPermissionUsecase.execute.mockResolvedValue(dto);
    const res = await controller.createPermission(dto);
    expect(res).toEqual(dto);
    expect(createPermissionUsecase.execute).toHaveBeenCalledWith(dto);
  });

  it('should call getPermissionsByRole', async () => {
    const expected = [createMockPermissionServerDto()];
    getAllByRoleUsecase.execute.mockResolvedValue(expected);
    const res = await controller.getPermissionsByRole('role-uuid');
    expect(res).toEqual(expected);
    expect(getAllByRoleUsecase.execute).toHaveBeenCalledWith('role-uuid');
  });

  it('should call getPermissionByIds', async () => {
    const expected = createMockPermissionServerDto();
    getByIdsUsecase.execute.mockResolvedValue(expected);
    const res = await controller.getPermissionByIds('server-uuid', 'role-uuid');
    expect(res).toEqual(expected);
    expect(getByIdsUsecase.execute).toHaveBeenCalledWith(
      'server-uuid',
      'role-uuid',
    );
  });

  it('should call updatePermission', async () => {
    const dto = createMockPermissionServerDto();
    updatePermissionUsecase.execute.mockResolvedValue(dto);
    const res = await controller.updatePermission(
      'server-uuid',
      'role-uuid',
      dto,
    );
    expect(res).toEqual(dto);
    expect(updatePermissionUsecase.execute).toHaveBeenCalledWith(
      'server-uuid',
      'role-uuid',
      dto,
    );
  });

  it('should call deletePermission', async () => {
    deletePermissionUsecase.execute.mockResolvedValue(undefined);
    await expect(
      controller.deletePermission('server-uuid', 'role-uuid'),
    ).resolves.toBeUndefined();
    expect(deletePermissionUsecase.execute).toHaveBeenCalledWith(
      'server-uuid',
      'role-uuid',
    );
  });
});
