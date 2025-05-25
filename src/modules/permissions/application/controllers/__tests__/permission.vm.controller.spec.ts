import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmController } from '../permission.vm.controller';
import { createMockPermissionVmDto } from '@/modules/permissions/__mocks__/permissions.mock';
import {
  GetPermissionVmByIdsUseCase,
  UpdatePermissionVmUseCase,
} from '../../use-cases/permission-vm';
import { GetPermissionsVmByRoleUseCase } from '../../use-cases/permission-vm';
import { CreatePermissionVmUseCase } from '../../use-cases/permission-vm';

describe('PermissionVmController', () => {
  let controller: PermissionVmController;
  let createUseCase: any;
  let updateUseCase: any;
  let getByIdsUseCase: any;
  let getByRoleUseCase: any;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };
    getByIdsUseCase = { execute: jest.fn() };
    getByRoleUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionVmController],
      providers: [
        { provide: CreatePermissionVmUseCase, useValue: createUseCase },
        { provide: UpdatePermissionVmUseCase, useValue: updateUseCase },
        { provide: GetPermissionVmByIdsUseCase, useValue: getByIdsUseCase },
        { provide: GetPermissionsVmByRoleUseCase, useValue: getByRoleUseCase },
      ],
    }).compile();

    controller = module.get<PermissionVmController>(PermissionVmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto = createMockPermissionVmDto();
    createUseCase.execute.mockResolvedValue(dto);
    const res = await controller.create(dto);
    expect(res).toEqual(dto);
    expect(createUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('should call update', async () => {
    const dto = createMockPermissionVmDto();
    updateUseCase.execute.mockResolvedValue(dto);
    const res = await controller.update(dto);
    expect(res).toEqual(dto);
    expect(updateUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('should call getByIds', async () => {
    const dto = createMockPermissionVmDto();
    getByIdsUseCase.execute.mockResolvedValue(dto);
    const res = await controller.getByIds(dto);
    expect(res).toEqual(dto);
    expect(getByIdsUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('should call getByRole', async () => {
    const expected = [createMockPermissionVmDto()];
    getByRoleUseCase.execute.mockResolvedValue(expected);
    const res = await controller.getByRole('role-uuid');
    expect(res).toEqual(expected);
    expect(getByRoleUseCase.execute).toHaveBeenCalledWith('role-uuid');
  });
});
