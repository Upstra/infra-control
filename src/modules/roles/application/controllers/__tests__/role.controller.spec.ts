import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../role.controller';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  UpdateRoleUseCase,
} from '../../use-cases';
import { RoleCreationDto, RoleResponseDto } from '../../dto';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('RoleController', () => {
  let controller: RoleController;
  let createRoleUseCase: jest.Mocked<CreateRoleUseCase>;
  let getAllRolesUseCase: jest.Mocked<GetAllRolesUseCase>;
  let getRoleByIdUseCase: jest.Mocked<GetRoleByIdUseCase>;
  let updateRoleUseCase: jest.Mocked<UpdateRoleUseCase>;
  let deleteRoleUseCase: jest.Mocked<DeleteRoleUseCase>;

  beforeEach(async () => {
    createRoleUseCase = { execute: jest.fn() } as any;
    getAllRolesUseCase = { execute: jest.fn() } as any;
    getRoleByIdUseCase = { execute: jest.fn() } as any;
    updateRoleUseCase = { execute: jest.fn() } as any;
    deleteRoleUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: CreateRoleUseCase, useValue: createRoleUseCase },
        { provide: GetAllRolesUseCase, useValue: getAllRolesUseCase },
        { provide: GetRoleByIdUseCase, useValue: getRoleByIdUseCase },
        { provide: UpdateRoleUseCase, useValue: updateRoleUseCase },
        { provide: DeleteRoleUseCase, useValue: deleteRoleUseCase },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const roles = [
        new RoleResponseDto(createMockRole({ name: 'ADMIN' })),
        new RoleResponseDto(createMockRole({ name: 'GUEST' })),
      ];
      getAllRolesUseCase.execute.mockResolvedValue(roles);

      const result = await controller.getAllRoles();
      expect(result).toEqual(roles);
      expect(getAllRolesUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('getRoleById', () => {
    it('should return a role by id', async () => {
      const role = new RoleResponseDto(
        createMockRole({ id: 'uuid', name: 'ADMIN' }),
      );
      getRoleByIdUseCase.execute.mockResolvedValue(role);

      const result = await controller.getRoleById('uuid');
      expect(result).toEqual(role);
      expect(getRoleByIdUseCase.execute).toHaveBeenCalledWith('uuid');
    });

    it('should propagate error if usecase throws', async () => {
      getRoleByIdUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(controller.getRoleById('bad-id')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const dto: RoleCreationDto = { name: 'NEW_ROLE' };
      const role = new RoleResponseDto(createMockRole({ name: 'NEW_ROLE' }));
      createRoleUseCase.execute.mockResolvedValue(role);

      const result = await controller.createRole(dto);
      expect(result).toEqual(role);
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const dto: RoleCreationDto = { name: 'UPD_ROLE' };
      const role = new RoleResponseDto(createMockRole({ name: 'UPD_ROLE' }));
      updateRoleUseCase.execute.mockResolvedValue(role);

      const result = await controller.updateRole('uuid', dto);
      expect(result).toEqual(role);
      expect(updateRoleUseCase.execute).toHaveBeenCalledWith('uuid', dto);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      deleteRoleUseCase.execute.mockResolvedValue(undefined);

      await expect(controller.deleteRole('uuid')).resolves.toBeUndefined();
      expect(deleteRoleUseCase.execute).toHaveBeenCalledWith('uuid');
    });

    it('should propagate error from usecase', async () => {
      deleteRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.deleteRole('uuid')).rejects.toThrow('fail');
    });
  });
});
