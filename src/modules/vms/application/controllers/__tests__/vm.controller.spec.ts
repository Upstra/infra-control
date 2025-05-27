import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../vm.controller';
import {
  CreateVmUseCase,
  DeleteVmUseCase,
  GetAllVmsUseCase,
  GetVmByIdUseCase,
  UpdateVmUseCase,
} from '../../use-cases';
import { createMockVm } from '../../../__mocks__/vms.mock';
import { VmCreationDto } from '../../dto/vm.creation.dto';
import { VmUpdateDto } from '../../dto/vm.update.dto';

describe('VmController', () => {
  let controller: VmController;
  let getAllVmsUseCase: jest.Mocked<GetAllVmsUseCase>;
  let getVmByIdUseCase: jest.Mocked<GetVmByIdUseCase>;
  let createVmUseCase: jest.Mocked<CreateVmUseCase>;
  let updateVmUseCase: jest.Mocked<UpdateVmUseCase>;
  let deleteVmUseCase: jest.Mocked<DeleteVmUseCase>;

  beforeEach(async () => {
    getAllVmsUseCase = { execute: jest.fn() } as any;
    getVmByIdUseCase = { execute: jest.fn() } as any;
    createVmUseCase = { execute: jest.fn() } as any;
    updateVmUseCase = { execute: jest.fn() } as any;
    deleteVmUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmController],
      providers: [
        { provide: GetAllVmsUseCase, useValue: getAllVmsUseCase },
        { provide: GetVmByIdUseCase, useValue: getVmByIdUseCase },
        { provide: CreateVmUseCase, useValue: createVmUseCase },
        { provide: UpdateVmUseCase, useValue: updateVmUseCase },
        { provide: DeleteVmUseCase, useValue: deleteVmUseCase },
      ],
    }).compile();

    controller = module.get<VmController>(VmController);
  });

  it('should return all VMs', async () => {
    const vm = createMockVm();
    getAllVmsUseCase.execute.mockResolvedValue([vm]);
    const result = await controller.getAllVms();
    expect(result).toEqual([vm]);
  });

  it('should return a VM by ID', async () => {
    const vm = createMockVm();
    getVmByIdUseCase.execute.mockResolvedValue(vm);
    const result = await controller.getVmById('vm-1');
    expect(result).toEqual(vm);
  });

  it('should create a VM', async () => {
    const vm = createMockVm();
    const dto: VmCreationDto = {
      name: vm.name,
      state: vm.state,
      grace_period_on: vm.grace_period_on,
      grace_period_off: vm.grace_period_off,
      os: vm.os,
      adminUrl: vm.adminUrl,
      ip: vm.ip,
      login: vm.login,
      password: vm.password,
      priority: vm.priority,
      serverId: vm.serverId,
      groupId: vm.groupId,
    };
    createVmUseCase.execute.mockResolvedValue(vm);
    const result = await controller.createVm(dto);
    expect(result).toEqual(vm);
  });

  it('should update a VM', async () => {
    const vm = createMockVm();
    const dto: VmUpdateDto = {
      name: 'Updated Name',
    };
    updateVmUseCase.execute.mockResolvedValue(vm);
    const result = await controller.updateVm('vm-1', dto);
    expect(result).toEqual(vm);
  });

  it('should delete a VM', async () => {
    deleteVmUseCase.execute.mockResolvedValue(undefined);
    await controller.deleteVm('vm-1');
    expect(deleteVmUseCase.execute).toHaveBeenCalledWith('vm-1');
  });
});
