import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerController } from '../permission.server.controller';

import { createMockPermissionServerDto } from '@/modules/permissions/__mocks__/permissions.mock';
import { UpdatePermissionServerDto } from '../../dto/permission.server.dto';
import {
  CreatePermissionServerUseCase,
  CreateBatchPermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetPermissionServerByIdsUseCase,
  GetPermissionsServerByRoleUseCase,
  UpdatePermissionServerUseCase,
  GetUserServerPermissionsUseCase,
} from '../../use-cases/permission-server';
import { BatchPermissionServerDto, BatchPermissionServerResponseDto } from '../../dto/batch-permission.server.dto';

describe('PermissionServerController', () => {
  let controller: PermissionServerController;
  let createPermissionUsecase: any;
  let createBatchPermissionUsecase: any;
  let getAllByRoleUsecase: any;
  let getByIdsUsecase: any;
  let updatePermissionUsecase: any;
  let deletePermissionUsecase: any;
  let getUserServerPermissionsUseCase: any;

  beforeEach(async () => {
    createPermissionUsecase = { execute: jest.fn() };
    createBatchPermissionUsecase = { execute: jest.fn() };
    getAllByRoleUsecase = { execute: jest.fn() };
    getByIdsUsecase = { execute: jest.fn() };
    updatePermissionUsecase = { execute: jest.fn() };
    deletePermissionUsecase = { execute: jest.fn() };
    getUserServerPermissionsUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionServerController],
      providers: [
        {
          provide: CreatePermissionServerUseCase,
          useValue: createPermissionUsecase,
        },
        {
          provide: CreateBatchPermissionServerUseCase,
          useValue: createBatchPermissionUsecase,
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
        {
          provide: GetUserServerPermissionsUseCase,
          useValue: getUserServerPermissionsUseCase,
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
    const updateDto: UpdatePermissionServerDto = {
      bitmask: 7,
    };
    const expectedResult = createMockPermissionServerDto();
    expectedResult.bitmask = 7;
    updatePermissionUsecase.execute.mockResolvedValue(expectedResult);
    const res = await controller.updatePermission(
      'server-uuid',
      'role-uuid',
      updateDto,
    );
    expect(res).toEqual(expectedResult);
    expect(updatePermissionUsecase.execute).toHaveBeenCalledWith(
      'server-uuid',
      'role-uuid',
      updateDto,
    );
  });

  it('should update permission with different bitmask values', async () => {
    const serverId = 'server-uuid';
    const roleId = 'role-uuid';
    const testCases = [
      { bitmask: 0 },
      { bitmask: 1 },
      { bitmask: 15 },
      { bitmask: 255 },
    ];

    for (const testCase of testCases) {
      const updateDto: UpdatePermissionServerDto = {
        bitmask: testCase.bitmask,
      };
      const expectedResult = createMockPermissionServerDto();
      expectedResult.bitmask = testCase.bitmask;

      updatePermissionUsecase.execute.mockResolvedValue(expectedResult);

      const result = await controller.updatePermission(serverId, roleId, updateDto);

      expect(result).toEqual(expectedResult);
      expect(updatePermissionUsecase.execute).toHaveBeenCalledWith(serverId, roleId, updateDto);
    }
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

  it('should call getUserPermissionsMe with current user', async () => {
    const expected = [createMockPermissionServerDto()];
    getUserServerPermissionsUseCase.execute.mockResolvedValue(expected);
    const currentUser = { userId: 'user-123', email: 'test@example.com' };
    const res = await controller.getUserPermissionsMe(currentUser);
    expect(res).toEqual(expected);
    expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
      'user-123',
    );
  });

  it('should call getUserPermissions with param userId', async () => {
    const expected = [createMockPermissionServerDto()];
    getUserServerPermissionsUseCase.execute.mockResolvedValue(expected);
    const res = await controller.getUserPermissions('user-456');
    expect(res).toEqual(expected);
    expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
      'user-456',
    );
  });

  it('should call createBatchPermissions', async () => {
    const batchDto = new BatchPermissionServerDto();
    batchDto.permissions = [
      createMockPermissionServerDto(),
      createMockPermissionServerDto(),
    ];

    const response: BatchPermissionServerResponseDto = {
      created: batchDto.permissions,
      failed: [],
      total: 2,
      successCount: 2,
      failureCount: 0,
    };

    createBatchPermissionUsecase.execute.mockResolvedValue(response);
    const res = await controller.createBatchPermissions(batchDto);
    expect(res).toEqual(response);
    expect(createBatchPermissionUsecase.execute).toHaveBeenCalledWith(batchDto);
  });

  it('should handle partial failures in createBatchPermissions', async () => {
    const batchDto = new BatchPermissionServerDto();
    batchDto.permissions = [
      createMockPermissionServerDto(),
      createMockPermissionServerDto(),
    ];

    const response: BatchPermissionServerResponseDto = {
      created: [batchDto.permissions[0]],
      failed: [{
        permission: batchDto.permissions[1],
        error: 'Duplicate permission',
      }],
      total: 2,
      successCount: 1,
      failureCount: 1,
    };

    createBatchPermissionUsecase.execute.mockResolvedValue(response);
    const res = await controller.createBatchPermissions(batchDto);
    expect(res).toEqual(response);
    expect(res.failureCount).toBe(1);
    expect(res.failed[0].error).toBe('Duplicate permission');
  });
});
