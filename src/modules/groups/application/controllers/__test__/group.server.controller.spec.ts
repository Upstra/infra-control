import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerController } from '../group.server.controller';
import {
  CreateGroupServerUseCase,
  GetAllGroupServerUseCase,
  GetGroupServerByIdUseCase,
  UpdateGroupServerUseCase,
  DeleteGroupServerUseCase,
} from '../../use-cases/group-server';

describe('GroupServerController', () => {
  let controller: GroupServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupServerController],
      providers: [
        { provide: CreateGroupServerUseCase, useValue: { execute: jest.fn() } },
        { provide: GetAllGroupServerUseCase, useValue: { execute: jest.fn() } },
        {
          provide: GetGroupServerByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: UpdateGroupServerUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteGroupServerUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<GroupServerController>(GroupServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
