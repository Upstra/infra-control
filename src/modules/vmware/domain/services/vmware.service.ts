import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PythonExecutorService } from '@/core/services/python-executor';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import {
  IVmwareService,
  VmwareVm,
  VmwareVmMetrics,
  VmwareHost,
} from '../interfaces';

@Injectable()
export class VmwareService implements IVmwareService {
  private readonly logger = new Logger(VmwareService.name);

  constructor(private readonly pythonExecutor: PythonExecutorService) {}

  async listVMs(connection: VmwareConnectionDto): Promise<VmwareVm[]> {
    const args = this.buildConnectionArgs(connection);

    try {
      const result = await this.pythonExecutor.executePython('list_vm.py', args);
      return this.parseVmList(result);
    } catch (error) {
      this.logger.error('Failed to list VMs:', error);
      throw this.handlePythonError(error, 'Failed to retrieve VM list');
    }
  }

  async getVMMetrics(moid: string, connection: VmwareConnectionDto): Promise<VmwareVmMetrics> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython('vm_metrics.py', args);
      return this.parseVmMetrics(result);
    } catch (error) {
      this.logger.error(`Failed to get metrics for VM ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve VM metrics');
    }
  }

  async controlVMPower(
    moid: string,
    action: 'on' | 'off',
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newState: string }> {
    const scriptName = action === 'on' ? 'turn_on.py' : 'turn_off.py';
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(scriptName, args);
      return {
        success: true,
        message: result.message ?? `VM ${action === 'on' ? 'started' : 'stopped'} successfully`,
        newState: action === 'on' ? 'poweredOn' : 'poweredOff',
      };
    } catch (error) {
      this.logger.error(`Failed to ${action} VM ${moid}:`, error);
      throw this.handlePythonError(error, `Failed to ${action} VM`);
    }
  }

  async migrateVM(
    vmMoid: string,
    destinationMoid: string,
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newHost: string }> {
    const args = [
      '--vmMoId', vmMoid,
      '--distMoId', destinationMoid,
      ...this.buildConnectionArgs(connection),
    ];

    try {
      const result = await this.pythonExecutor.executePython('migrate_vm.py', args);
      return {
        success: true,
        message: result.message ?? 'VM migrated successfully',
        newHost: result.newHost ?? destinationMoid,
      };
    } catch (error) {
      this.logger.error(`Failed to migrate VM ${vmMoid}:`, error);
      throw this.handlePythonError(error, 'Failed to migrate VM');
    }
  }

  async getHostMetrics(moid: string, connection: VmwareConnectionDto): Promise<VmwareHost> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython('server_metrics.py', args);
      return this.parseHostMetrics(result);
    } catch (error) {
      this.logger.error(`Failed to get metrics for host ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve host metrics');
    }
  }

  private buildConnectionArgs(connection: VmwareConnectionDto): string[] {
    const args = [
      '--ip', connection.host,
      '--user', connection.user,
      '--password', connection.password,
    ];

    if (connection.port && connection.port !== 443) {
      args.push('--port', connection.port.toString());
    }

    return args;
  }

  private parseVmList(result: any): VmwareVm[] {
    if (!result || !Array.isArray(result.vms)) {
      return [];
    }

    return result.vms.map((vm: any) => ({
      moid: vm.moid,
      name: vm.name,
      powerState: vm.powerState,
      guestOS: vm.guestOS,
      ipAddress: vm.ipAddress,
      hostname: vm.hostname,
      numCpu: vm.numCpu,
      memoryMB: vm.memoryMB,
      toolsStatus: vm.toolsStatus,
      annotation: vm.annotation,
    }));
  }

  private parseVmMetrics(result: any): VmwareVmMetrics {
    return {
      vmName: result.vmName,
      powerState: result.powerState,
      cpuUsageMhz: result.cpuUsageMhz ?? 0,
      memoryUsageMB: result.memoryUsageMB ?? 0,
      storageUsageGB: result.storageUsageGB ?? 0,
      uptimeSeconds: result.uptimeSeconds ?? 0,
      guestOS: result.guestOS ?? 'Unknown',
      toolsStatus: result.toolsStatus ?? 'Unknown',
      ipAddress: result.ipAddress,
      numCpu: result.numCpu ?? 0,
      memoryMB: result.memoryMB ?? 0,
    };
  }

  private parseHostMetrics(result: any): VmwareHost {
    return {
      moid: result.moid,
      name: result.name,
      connectionState: result.connectionState ?? 'disconnected',
      powerState: result.powerState ?? 'poweredOff',
      cpuInfo: {
        model: result.cpuInfo?.model ?? 'Unknown',
        cores: result.cpuInfo?.cores ?? 0,
        threads: result.cpuInfo?.threads ?? 0,
        mhz: result.cpuInfo?.mhz ?? 0,
      },
      memoryInfo: {
        totalMB: result.memoryInfo?.totalMB ?? 0,
        usedMB: result.memoryInfo?.usedMB ?? 0,
        freeMB: result.memoryInfo?.freeMB ?? 0,
      },
      uptimeSeconds: result.uptimeSeconds ?? 0,
    };
  }

  private handlePythonError(error: any, defaultMessage: string): HttpException {
    const message = error.message ?? defaultMessage;

    if (message.includes('Authentication failed') || message.includes('401')) {
      return new HttpException('Invalid VMware credentials', HttpStatus.UNAUTHORIZED);
    }

    if (message.includes('not found') || message.includes('404')) {
      return new HttpException('Resource not found', HttpStatus.NOT_FOUND);
    }

    if (message.includes('timeout')) {
      return new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    return new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}