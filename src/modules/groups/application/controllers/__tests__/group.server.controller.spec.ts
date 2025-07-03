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
import { GroupServerResponseDto } from '../../dto/group.server.response.dto';
import { ToggleCascadeUseCase } from '../../use-cases/toggle-cascade.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('GroupServerController', () => {
  let controller: GroupServerController;
  let createUseCase: jest.Mocked<CreateGroupServerUseCase>;
  let getAllUseCase: jest.Mocked<GetAllGroupServerUseCase>;
  let getByIdUseCase: jest.Mocked<GetGroupServerByIdUseCase>;
  let updateUseCase: jest.Mocked<UpdateGroupServerUseCase>;
  let deleteUseCase: jest.Mocked<DeleteGroupServerUseCase>;
  let toggleCascadeUseCase: jest.Mocked<ToggleCascadeUseCase>;

  const mockUser: JwtPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() } as any;
    getAllUseCase = { execute: jest.fn() } as any;
    getByIdUseCase = { execute: jest.fn() } as any;
    updateUseCase = { execute: jest.fn() } as any;
    deleteUseCase = { execute: jest.fn() } as any;
    toggleCascadeUseCase = { execute: jest.fn() } as any;

    const mockJwtGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupServerController],
      providers: [
        { provide: CreateGroupServerUseCase, useValue: createUseCase },
        { provide: GetAllGroupServerUseCase, useValue: getAllUseCase },
        { provide: GetGroupServerByIdUseCase, useValue: getByIdUseCase },
        { provide: UpdateGroupServerUseCase, useValue: updateUseCase },
        { provide: DeleteGroupServerUseCase, useValue: deleteUseCase },
        { provide: ToggleCascadeUseCase, useValue: toggleCascadeUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<GroupServerController>(GroupServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getAllGroups', async () => {
    const mockResponse = [
      new GroupServerResponseDto({
        id: 'group-1',
        name: 'Test Group',
        priority: 1,
        cascade: true,
        servers: [],
        vmGroups: [],
      } as any),
    ];
    getAllUseCase.execute.mockResolvedValue(mockResponse);

    const result = await controller.getAllGroups();

    expect(getAllUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
    expect(result).toEqual(mockResponse);
  });

  it('should call getGroupById', async () => {
    const mockResponse = new GroupServerResponseDto({
      id: 'uuid-1',
      name: 'Test Group',
      priority: 1,
      cascade: true,
      servers: [],
      vmGroups: [],
    } as any);
    getByIdUseCase.execute.mockResolvedValue(mockResponse);

    const result = await controller.getGroupById('uuid-1');
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(mockResponse);
  });

  it('should call createGroup', async () => {
    const dto = new GroupServerDto({ name: 'New Group', priority: 1 });
    const mockResponse = new GroupServerResponseDto({
      id: 'new-id',
      name: 'New Group',
      priority: 1,
      cascade: true,
      servers: [],
      vmGroups: [],
    } as any);
    createUseCase.execute.mockResolvedValue(mockResponse);

    const result = await controller.createGroup(dto, mockUser);
    expect(createUseCase.execute).toHaveBeenCalledWith(dto, mockUser.userId);
    expect(result).toEqual(mockResponse);
  });

  it('should call updateGroup', async () => {
    const dto = new GroupServerDto({ name: 'Updated Group', priority: 2 });
    const mockResponse = new GroupServerResponseDto({
      id: 'uuid-2',
      name: 'Updated Group',
      priority: 2,
      cascade: true,
      servers: [],
      vmGroups: [],
    } as any);
    updateUseCase.execute.mockResolvedValue(mockResponse);

    const result = await controller.updateGroup('uuid-2', dto, mockUser);
    expect(updateUseCase.execute).toHaveBeenCalledWith(
      'uuid-2',
      dto,
      mockUser.userId,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should call deleteGroup', async () => {
    deleteUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.deleteGroup('uuid-3', mockUser);
    expect(deleteUseCase.execute).toHaveBeenCalledWith(
      'uuid-3',
      mockUser.userId,
    );
    expect(result).toBeUndefined();
  });
});
