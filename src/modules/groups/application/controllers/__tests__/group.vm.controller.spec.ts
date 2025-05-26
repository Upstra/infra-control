import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmController } from '../group.vm.controller';
import { GetAllGroupVmUseCase } from '../../use-cases/group-vm/get-all-group-vm.use-case';
import {
  CreateGroupVmUseCase,
  UpdateGroupVmUseCase,
} from '../../use-cases/group-vm';
import { GetGroupVmByIdUseCase } from '../../use-cases/group-vm/get-group-vm-by-id.use-case';
import { DeleteGroupVmUseCase } from '../../use-cases/group-vm/delete-group-vm.use-case';
import { GroupVmDto } from '../../dto/group.vm.dto';

describe('GroupVmController', () => {
  let controller: GroupVmController;
  let createUseCase: jest.Mocked<CreateGroupVmUseCase>;
  let getAllUseCase: jest.Mocked<GetAllGroupVmUseCase>;
  let getByIdUseCase: jest.Mocked<GetGroupVmByIdUseCase>;
  let updateUseCase: jest.Mocked<UpdateGroupVmUseCase>;
  let deleteUseCase: jest.Mocked<DeleteGroupVmUseCase>;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() } as any;
    getAllUseCase = { execute: jest.fn() } as any;
    getByIdUseCase = { execute: jest.fn() } as any;
    updateUseCase = { execute: jest.fn() } as any;
    deleteUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupVmController],
      providers: [
        { provide: CreateGroupVmUseCase, useValue: createUseCase },
        { provide: GetAllGroupVmUseCase, useValue: getAllUseCase },
        { provide: GetGroupVmByIdUseCase, useValue: getByIdUseCase },
        { provide: UpdateGroupVmUseCase, useValue: updateUseCase },
        { provide: DeleteGroupVmUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<GroupVmController>(GroupVmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getAllGroups', async () => {
    const groups = [new GroupVmDto({} as any)];
    getAllUseCase.execute.mockResolvedValue(groups);

    const result = await controller.getAllGroups();

    expect(getAllUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual(groups);
  });

  it('should call getGroupById', async () => {
    const group = new GroupVmDto({} as any);
    getByIdUseCase.execute.mockResolvedValue(group);

    const result = await controller.getGroupById('uuid-1');
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(group);
  });

  it('should call createGroup', async () => {
    const dto = new GroupVmDto({} as any);
    createUseCase.execute.mockResolvedValue(dto);

    const result = await controller.createGroup(dto);
    expect(createUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual(dto);
  });

  it('should call updateGroup', async () => {
    const dto = new GroupVmDto({} as any);
    updateUseCase.execute.mockResolvedValue(dto);

    const result = await controller.updateGroup('uuid-2', dto);
    expect(updateUseCase.execute).toHaveBeenCalledWith('uuid-2', dto);
    expect(result).toEqual(dto);
  });

  it('should call deleteGroup', async () => {
    deleteUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.deleteGroup('uuid-3');
    expect(deleteUseCase.execute).toHaveBeenCalledWith('uuid-3');
    expect(result).toBeUndefined();
  });
});
