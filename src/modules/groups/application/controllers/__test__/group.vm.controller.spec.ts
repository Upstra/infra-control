import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmController } from '../group.vm.controller';
import {
  CreateGroupVmUseCase,
  GetAllGroupVmUseCase,
  GetGroupVmByIdUseCase,
  UpdateGroupVmUseCase,
  DeleteGroupVmUseCase,
} from '../../use-cases/group-vm';

describe('GroupVmController', () => {
  let controller: GroupVmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupVmController],
      providers: [
        { provide: CreateGroupVmUseCase, useValue: { execute: jest.fn() } },
        { provide: GetAllGroupVmUseCase, useValue: { execute: jest.fn() } },
        { provide: GetGroupVmByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateGroupVmUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteGroupVmUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<GroupVmController>(GroupVmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
