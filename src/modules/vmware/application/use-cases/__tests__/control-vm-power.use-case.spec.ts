import { ControlVmPowerUseCase } from '../control-vm-power.use-case';
import { VmPowerAction } from '../../dto';
import { Repository } from 'typeorm';

describe('ControlVmPowerUseCase', () => {
  let useCase: ControlVmPowerUseCase;
  let mockVmwareService: any;
  let mockServerRepository: jest.Mocked<Repository<any>>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.10',
    login: 'admin',
    password: 'password123',
  };

  beforeEach(() => {
    mockVmwareService = {
      listVMs: jest.fn(),
      getVMMetrics: jest.fn(),
      controlVMPower: jest.fn(),
      migrateVM: jest.fn(),
    };

    mockServerRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<any>>;

    useCase = new ControlVmPowerUseCase(
      mockVmwareService,
      mockServerRepository,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should successfully power on a VM', async () => {
    const mockResult = {
      success: true,
      message: 'VM powered on successfully',
      newState: 'poweredOn',
    };

    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.controlVMPower.mockResolvedValue(mockResult);

    const result = await useCase.execute(
      'server-1',
      'vm-123',
      VmPowerAction.POWER_ON,
    );

    expect(result).toEqual(mockResult);
    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-1' },
    });
    expect(mockVmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-123',
      VmPowerAction.POWER_ON,
      {
        host: mockServer.ip,
        user: mockServer.login,
        password: mockServer.password,
        port: 443,
      },
    );
  });

  it('should power off a VM', async () => {
    const mockResult = {
      success: true,
      message: 'VM powered off successfully',
      newState: 'poweredOff',
    };

    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.controlVMPower.mockResolvedValue(mockResult);

    const result = await useCase.execute(
      'server-1',
      'vm-123',
      VmPowerAction.POWER_OFF,
    );

    expect(result).toEqual(mockResult);
    expect(mockVmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-123',
      VmPowerAction.POWER_OFF,
      {
        host: mockServer.ip,
        user: mockServer.login,
        password: mockServer.password,
        port: 443,
      },
    );
  });

  it('should throw error when server is not found', async () => {
    mockServerRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute('server-999', 'vm-123', VmPowerAction.POWER_ON),
    ).rejects.toThrow('Server with ID server-999 not found');

    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-999' },
    });
    expect(mockVmwareService.controlVMPower).not.toHaveBeenCalled();
  });

  it('should handle VM power control failure', async () => {
    const error = new Error('Failed to control VM power');
    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.controlVMPower.mockRejectedValue(error);

    await expect(
      useCase.execute('server-1', 'vm-123', VmPowerAction.RESET),
    ).rejects.toThrow(error);

    expect(mockVmwareService.controlVMPower).toHaveBeenCalledWith(
      'vm-123',
      'off',
      {
        host: mockServer.ip,
        user: mockServer.login,
        password: mockServer.password,
        port: 443,
      },
    );
  });
});
