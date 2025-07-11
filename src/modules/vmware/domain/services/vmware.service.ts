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
      const result = await this.pythonExecutor.executePython(
        'list_vm.py',
        args,
      );
      return this.parseVmList(result);
    } catch (error) {
      this.logger.error('Failed to list VMs:', error);
      throw this.handlePythonError(error, 'Failed to retrieve VM list');
    }
  }

  async getVMMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareVmMetrics> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'vm_metrics.py',
        args,
      );
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
        message:
          result.message ??
          `VM ${action === 'on' ? 'started' : 'stopped'} successfully`,
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
      '--vmMoId',
      vmMoid,
      '--distMoId',
      destinationMoid,
      ...this.buildConnectionArgs(connection),
    ];

    try {
      const result = await this.pythonExecutor.executePython(
        'migrate_vm.py',
        args,
      );
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

  async getHostMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareHost> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'server_metrics.py',
        args,
      );
      return this.parseHostMetrics(result);
    } catch (error) {
      this.logger.error(`Failed to get metrics for host ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve host metrics');
    }
  }

  private buildConnectionArgs(connection: VmwareConnectionDto): string[] {
    const args = [
      '--ip',
      connection.host,
      '--user',
      connection.user,
      '--password',
      connection.password,
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
      powerState: result.powerState ?? 'poweredOff',
      guestState: result.guestState ?? 'unknown',
      connectionState: result.connectionState ?? 'disconnected',
      guestHeartbeatStatus: result.guestHeartbeatStatus ?? 'gray',
      overallStatus: result.overallStatus ?? 'gray',
      maxCpuUsage: result.maxCpuUsage ?? 0,
      maxMemoryUsage: result.maxMemoryUsage ?? 0,
      bootTime: result.bootTime ?? '',
      isMigrating: result.isMigrating ?? false,
      overallCpuUsage: result.overallCpuUsage ?? 0,
      guestMemoryUsage: result.guestMemoryUsage ?? 0,
      uptimeSeconds: result.uptimeSeconds ?? 0,
      swappedMemory: result.swappedMemory ?? 0,
      usedStorage: result.usedStorage ?? 0,
      totalStorage: result.totalStorage ?? 0,
    };
  }

  private parseHostMetrics(result: any): VmwareHost {
    return {
      name: result.name,
      ip: result.ip,
      powerState: result.powerState ?? 'poweredOff',
      vCenterIp: result.vCenterIp,
      overallStatus: result.overallStatus ?? 'gray',
      cpuCores: result.cpuCores ?? 0,
      ramTotal: result.ramTotal ?? 0,
      rebootRequired: result.rebootRequired ?? false,
      cpuUsageMHz: result.cpuUsageMHz ?? 0,
      ramUsageMB: result.ramUsageMB ?? 0,
      uptime: result.uptime ?? 0,
      boottime: result.boottime ?? '',
      cluster: result.cluster ?? '',
      cpuHz: result.cpuHz ?? 0,
      numCpuCores: result.numCpuCores ?? 0,
      numCpuThreads: result.numCpuThreads ?? 0,
      model: result.model ?? 'Unknown',
      vendor: result.vendor ?? 'Unknown',
      biosVendor: result.biosVendor ?? 'Unknown',
      firewall: result.firewall ?? 'Unknown',
      maxHostRunningVms: result.maxHostRunningVms ?? 0,
      maxHostSupportedVcpus: result.maxHostSupportedVcpus ?? 0,
      maxMemMBPerFtVm: result.maxMemMBPerFtVm ?? 0,
      maxNumDisksSVMotion: result.maxNumDisksSVMotion ?? 0,
      maxRegisteredVMs: result.maxRegisteredVMs ?? 0,
      maxRunningVMs: result.maxRunningVMs ?? 0,
      maxSupportedVcpus: result.maxSupportedVcpus ?? 0,
      maxSupportedVmMemory: result.maxSupportedVmMemory ?? 0,
      maxVcpusPerFtVm: result.maxVcpusPerFtVm ?? 0,
      quickBootSupported: result.quickBootSupported ?? false,
      rebootSupported: result.rebootSupported ?? false,
      shutdownSupported: result.shutdownSupported ?? false,
    };
  }

  private handlePythonError(error: any, defaultMessage: string): HttpException {
    const message = error.message ?? defaultMessage;

    if (message.includes('Authentication failed') || message.includes('401')) {
      return new HttpException(
        'Invalid VMware credentials',
        HttpStatus.UNAUTHORIZED,
      );
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
