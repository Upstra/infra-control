import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerController } from '../group.server.controller';
import {
  CreateGroupServerUseCase,
  DeleteGroupServerUseCase,
  GetAllGroupServerUseCase,
  GetGroupServerByIdUseCase,
  UpdateGroupServerUseCase,
} from '../../use-cases/group-server';
import { GroupServerDto } from '../../dto/group.server.dto';

describe('GroupServerController', () => {
  let controller: GroupServerController;
  let createUseCase: jest.Mocked<CreateGroupServerUseCase>;
  let getAllUseCase: jest.Mocked<GetAllGroupServerUseCase>;
  let getByIdUseCase: jest.Mocked<GetGroupServerByIdUseCase>;
  let updateUseCase: jest.Mocked<UpdateGroupServerUseCase>;
  let deleteUseCase: jest.Mocked<DeleteGroupServerUseCase>;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() } as any;
    getAllUseCase = { execute: jest.fn() } as any;
    getByIdUseCase = { execute: jest.fn() } as any;
    updateUseCase = { execute: jest.fn() } as any;
    deleteUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupServerController],
      providers: [
        { provide: CreateGroupServerUseCase, useValue: createUseCase },
        { provide: GetAllGroupServerUseCase, useValue: getAllUseCase },
        { provide: GetGroupServerByIdUseCase, useValue: getByIdUseCase },
        { provide: UpdateGroupServerUseCase, useValue: updateUseCase },
        { provide: DeleteGroupServerUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<GroupServerController>(GroupServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getAllGroups', async () => {
    const groups = [new GroupServerDto({} as any)];
    getAllUseCase.execute.mockResolvedValue(groups);

    const result = await controller.getAllGroups();

    expect(getAllUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual(groups);
  });

  it('should call getGroupById', async () => {
    const group = new GroupServerDto({} as any);
    getByIdUseCase.execute.mockResolvedValue(group);

    const result = await controller.getGroupById('uuid-1');
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(group);
  });

  it('should call createGroup', async () => {
    const dto = new GroupServerDto({} as any);
    createUseCase.execute.mockResolvedValue(dto);

    const result = await controller.createGroup(dto);
    expect(createUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual(dto);
  });

  it('should call updateGroup', async () => {
    const dto = new GroupServerDto({} as any);
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
