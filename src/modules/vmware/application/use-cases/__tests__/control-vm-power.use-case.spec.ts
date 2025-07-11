import { Test, TestingModule } from '@nestjs/testing';
import { ControlVmPowerUseCase } from '../control-vm-power.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmPowerActionDto, VmPowerAction } from '@/modules/vmware/application/dto';

describe('ControlVmPowerUseCase', () => {
  let useCase: ControlVmPowerUseCase;
  let vmwareService: jest.Mocked<VmwareService>;

  const mockPowerActionDto: VmPowerActionDto = {
    action: VmPowerAction.ON,
    connection: {
      host: '192.168.1.10',
      user: 'admin',
      password: 'password123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlVmPowerUseCase,
        {
          provide: VmwareService,
          useValue: {
            controlVMPower: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ControlVmPowerUseCase>(ControlVmPowerUseCase);
    vmwareService = module.get(VmwareService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should power on VM successfully', async () => {
    const mockResult = {
      success: true,
      message: 'VM powered on successfully',
      newState: 'poweredOn',
    };

    vmwareService.controlVMPower.mockResolvedValue(mockResult);

    const result = await useCase.execute('vm-123', mockPowerActionDto);

    expect(result).toEqual(mockResult);
    expect(vmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-123',
      'on',
      mockPowerActionDto.connection,
    );
  });

  it('should power off VM successfully', async () => {
    const powerOffDto: VmPowerActionDto = {
      ...mockPowerActionDto,
      action: VmPowerAction.OFF,
    };

    const mockResult = {
      success: true,
      message: 'VM powered off successfully',
      newState: 'poweredOff',
    };

    vmwareService.controlVMPower.mockResolvedValue(mockResult);

    const result = await useCase.execute('vm-123', powerOffDto);

    expect(result).toEqual(mockResult);
    expect(vmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-123',
      'off',
      powerOffDto.connection,
    );
  });

  it('should propagate errors from service', async () => {
    const error = new Error('VM not found');
    vmwareService.controlVMPower.mockRejectedValue(error);

    await expect(useCase.execute('vm-999', mockPowerActionDto)).rejects.toThrow(error);
    expect(vmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-999',
      'on',
      mockPowerActionDto.connection,
    );
  });
});