import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ControlVmPowerUseCase } from '../control-vm-power.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionService } from '@/modules/vmware/domain/services/vmware-connection.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmPowerAction } from '../../dto';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwarePowerState } from '@/modules/vmware/domain/interfaces/vmware-vm.interface';

describe('ControlVmPowerUseCase', () => {
  let useCase: ControlVmPowerUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let vmwareConnectionService: jest.Mocked<VmwareConnectionService>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockVcenter: Server = {
    id: 'vcenter-1',
    name: 'vCenter Server',
    ip: '192.168.1.10',
    login: 'administrator@vsphere.local',
    password: 'password123',
    type: 'vcenter',
  } as Server;

  const mockConnection = {
    host: '192.168.1.10',
    user: 'administrator@vsphere.local',
    password: 'password123',
    port: 443,
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
        {
          provide: VmwareConnectionService,
          useValue: {
            buildVmwareConnection: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findServerByTypeWithCredentials: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ControlVmPowerUseCase>(ControlVmPowerUseCase);
    vmwareService = module.get(VmwareService) as jest.Mocked<VmwareService>;
    vmwareConnectionService = module.get(VmwareConnectionService) as jest.Mocked<VmwareConnectionService>;
    serverRepository = module.get('ServerRepositoryInterface') as jest.Mocked<ServerRepositoryInterface>;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    beforeEach(() => {
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(mockVcenter);
      vmwareConnectionService.buildVmwareConnection.mockReturnValue(mockConnection);
    });

    it('should successfully power on a VM', async () => {
      const mockResult = {
        success: true,
        message: 'VM powered on successfully',
        newState: 'poweredOn' as VmwarePowerState,
      };

      vmwareService.controlVMPower.mockResolvedValue(mockResult);

      const result = await useCase.execute('vm-123', VmPowerAction.POWER_ON);

      expect(result).toEqual(mockResult);
      expect(serverRepository.findServerByTypeWithCredentials).toHaveBeenCalledWith('vcenter');
      expect(vmwareConnectionService.buildVmwareConnection).toHaveBeenCalledWith(mockVcenter);
      expect(vmwareService.controlVMPower).toHaveBeenCalledWith('vm-123', 'on', mockConnection);
    });

    it('should successfully power off a VM', async () => {
      const mockResult = {
        success: true,
        message: 'VM powered off successfully',
        newState: 'poweredOff' as VmwarePowerState,
      };

      vmwareService.controlVMPower.mockResolvedValue(mockResult);

      const result = await useCase.execute('vm-123', VmPowerAction.POWER_OFF);

      expect(result).toEqual(mockResult);
      expect(vmwareService.controlVMPower).toHaveBeenCalledWith('vm-123', 'off', mockConnection);
    });

    it('should successfully reset a VM', async () => {
      const mockResult = {
        success: true,
        message: 'VM reset successfully',
        newState: 'poweredOn' as VmwarePowerState,
      };

      vmwareService.controlVMPower.mockResolvedValue(mockResult);

      const result = await useCase.execute('vm-123', VmPowerAction.RESET);

      expect(result).toEqual(mockResult);
      expect(vmwareService.controlVMPower).toHaveBeenCalledWith('vm-123', 'off', mockConnection);
    });

    it('should successfully suspend a VM', async () => {
      const mockResult = {
        success: true,
        message: 'VM suspended successfully',
        newState: 'suspended' as VmwarePowerState,
      };

      vmwareService.controlVMPower.mockResolvedValue(mockResult);

      const result = await useCase.execute('vm-123', VmPowerAction.SUSPEND);

      expect(result).toEqual(mockResult);
      expect(vmwareService.controlVMPower).toHaveBeenCalledWith('vm-123', 'off', mockConnection);
    });

    it('should throw NotFoundException when vCenter server is not found', async () => {
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(null);

      await expect(useCase.execute('vm-123', VmPowerAction.POWER_ON)).rejects.toThrow(
        new NotFoundException('vCenter server not found'),
      );

      expect(serverRepository.findServerByTypeWithCredentials).toHaveBeenCalledWith('vcenter');
      expect(vmwareConnectionService.buildVmwareConnection).not.toHaveBeenCalled();
      expect(vmwareService.controlVMPower).not.toHaveBeenCalled();
    });

    it('should handle VM power control failure', async () => {
      const error = new Error('Failed to control VM power');
      vmwareService.controlVMPower.mockRejectedValue(error);

      await expect(useCase.execute('vm-123', VmPowerAction.POWER_ON)).rejects.toThrow(error);

      expect(serverRepository.findServerByTypeWithCredentials).toHaveBeenCalledWith('vcenter');
      expect(vmwareConnectionService.buildVmwareConnection).toHaveBeenCalledWith(mockVcenter);
      expect(vmwareService.controlVMPower).toHaveBeenCalledWith('vm-123', 'on', mockConnection);
    });

    it('should use correct power action mapping', async () => {
      const testCases = [
        { action: VmPowerAction.POWER_ON, expectedVmAction: 'on' },
        { action: VmPowerAction.POWER_OFF, expectedVmAction: 'off' },
        { action: VmPowerAction.RESET, expectedVmAction: 'off' },
        { action: VmPowerAction.SUSPEND, expectedVmAction: 'off' },
      ];

      for (const testCase of testCases) {
        vmwareService.controlVMPower.mockResolvedValue({
          success: true,
          message: 'Action completed',
          newState: 'poweredOn' as VmwarePowerState,
        });

        await useCase.execute('vm-123', testCase.action);

        expect(vmwareService.controlVMPower).toHaveBeenCalledWith(
          'vm-123',
          testCase.expectedVmAction,
          mockConnection,
        );
      }
    });
  });
});