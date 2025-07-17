import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { PythonExecutorService } from '@/core/services/python-executor';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import {
  IVmwareService,
  VmwareVm,
  VmwareVmMetrics,
  VmwareHost,
  VmwareServerInfo,
  VmwareServerMetrics,
  VmwarePowerState,
  VmwareServerPowerState,
  VmwareGuestState,
  VmwareConnectionState,
  VmwareHealthStatus,
  VmwareServer,
} from '../interfaces';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmwareCacheService } from './vmware-cache.service';

interface RawVmwareServer {
  name?: string;
  vCenterIp?: string;
  cluster?: string;
  vendor?: string;
  model?: string;
  ip?: string;
  moid?: string;
  cpuCores?: number;
  cpuThreads?: number;
  cpuMHz?: number;
  ramTotal?: number;
}

@Injectable()
export class VmwareService implements IVmwareService {
  private readonly logger = new Logger(VmwareService.name);
  private vcenterInitialized = false;

  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly vmwareCacheService: VmwareCacheService,
  ) {}

  async listVMs(connection: VmwareConnectionDto): Promise<VmwareVm[]> {
    const args = this.buildConnectionArgs(connection);

    try {
      const result = await this.pythonExecutor.executePython(
        'list_vm.sh',
        args,
      );
      this.logger.debug('Raw script output:', JSON.stringify(result));

      if (result?.result?.httpCode && result.result.httpCode !== 200) {
        const errorMessage = result.result.message || 'Unknown error';
        this.logger.error(
          `Script returned error: ${errorMessage} (HTTP ${result.result.httpCode})`,
        );

        if (result.result.httpCode === 401) {
          throw new HttpException(
            'Invalid credentials',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(errorMessage, result.result.httpCode);
      }

      const parsedVms = this.parseVmList(result);
      this.logger.debug(`Parsed ${parsedVms.length} VMs`);
      return parsedVms;
    } catch (error) {
      this.logger.error('Failed to list VMs:', error);
      throw this.handlePythonError(error, 'Failed to retrieve VM list');
    }
  }

  async getVMMetrics(
    moid: string,
    connection: VmwareConnectionDto,
    force = false,
  ): Promise<VmwareVmMetrics> {
    await this.ensureVcenterInitialized();

    if (!force) {
      const cached = await this.vmwareCacheService.getVmMetrics(moid);
      if (cached) {
        return this.parseVmMetrics(cached);
      }
    }

    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'vm_metrics.sh',
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
  ): Promise<{
    success: boolean;
    message: string;
    newState: VmwarePowerState;
  }> {
    const scriptName = action === 'on' ? 'vm_start.sh' : 'vm_stop.sh';
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(scriptName, args);
      return {
        success: true,
        message:
          result.result?.message ??
          `VM ${action === 'on' ? 'started' : 'stopped'} successfully`,
        newState: (action === 'on'
          ? 'poweredOn'
          : 'poweredOff') as VmwarePowerState,
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
      '--vm_moid',
      vmMoid,
      '--dist_moid',
      destinationMoid,
      ...this.buildConnectionArgs(connection),
    ];

    try {
      const result = await this.pythonExecutor.executePython(
        'vm_migration.sh',
        args,
      );

      this.logger.debug('Migration result:', JSON.stringify(result));

      // Check if the result indicates an error
      if (result?.result?.httpCode && result.result.httpCode !== 200) {
        this.logger.error(
          `Migration failed with HTTP ${result.result.httpCode}:`,
          JSON.stringify(result, null, 2),
        );
        throw new HttpException(
          result.result.message || 'Migration failed',
          result.result.httpCode,
        );
      }

      return {
        success: true,
        message: result.result?.message ?? 'VM migrated successfully',
        newHost: result.newHost ?? destinationMoid,
      };
    } catch (error) {
      this.logger.error(`Failed to migrate VM ${vmMoid}:`, error);

      // If error has a result object, log it
      if (error?.result) {
        this.logger.error(
          'Migration error details:',
          JSON.stringify(error.result, null, 2),
        );
      }

      throw this.handlePythonError(error, 'Failed to migrate VM');
    }
  }

  async getServerInfo(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareServerInfo> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'server_info.sh',
        args,
      );
      return this.parseServerInfo(result);
    } catch (error) {
      this.logger.error(`Failed to get info for server ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve server info');
    }
  }

  async getServerMetrics(
    moid: string,
    connection: VmwareConnectionDto,
    force = false,
  ): Promise<VmwareServerMetrics> {
    await this.ensureVcenterInitialized();

    if (!force) {
      const cached = await this.vmwareCacheService.getServerMetrics(moid);
      if (cached) {
        return this.parseServerMetrics(cached);
      }
    }

    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'server_metrics.sh',
        args,
      );
      return this.parseServerMetrics(result);
    } catch (error) {
      this.logger.error(`Failed to get metrics for server ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve server metrics');
    }
  }

  async getHostMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareHost> {
    const args = ['--moid', moid, ...this.buildConnectionArgs(connection)];

    try {
      const result = await this.pythonExecutor.executePython(
        'server_metrics.sh',
        args,
      );
      return this.parseHostMetrics(result);
    } catch (error) {
      this.logger.error(`Failed to get metrics for host ${moid}:`, error);
      throw this.handlePythonError(error, 'Failed to retrieve host metrics');
    }
  }

  async listServers(connection: VmwareConnectionDto): Promise<VmwareServer[]> {
    const args = this.buildConnectionArgs(connection);

    try {
      const result = await this.pythonExecutor.executePython(
        'list_server.sh',
        args,
      );
      this.logger.debug('Raw servers output:', JSON.stringify(result));

      if (result?.result?.httpCode && result.result.httpCode !== 200) {
        const errorMessage = result.result.message || 'Unknown error';
        this.logger.error(
          `Script returned error: ${errorMessage} (HTTP ${result.result.httpCode})`,
        );

        if (result.result.httpCode === 401) {
          throw new HttpException(
            'Invalid credentials',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(errorMessage, result.result.httpCode);
      }

      const parsedServers = this.parseServerList(result);
      this.logger.debug(`Parsed ${parsedServers.length} servers`);

      const existingServers = await this.serverRepository.findAll();

      for (const server of parsedServers) {
        const existing = existingServers.find((s) => s.ip === server.ip);
        if (existing) {
          if (existing.vmwareHostMoid !== server.moid) {
            this.logger.debug(
              `Updating existing server ${existing.id} with new VMware host MOID: ${server.moid} (was: ${existing.vmwareHostMoid || 'null'})`,
            );
            await this.serverRepository.updateServer(existing.id, {
              vmwareHostMoid: server.moid,
            });
          } else {
            this.logger.debug(
              `Server ${existing.id} already has correct VMware host MOID: ${server.moid}`,
            );
          }
        }
      }

      return parsedServers;
    } catch (error) {
      this.logger.error('Failed to list servers:', error);
      throw this.handlePythonError(error, 'Failed to retrieve server list');
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
    this.logger.debug('parseVmList input:', JSON.stringify(result));

    if (!result || !Array.isArray(result.vms)) {
      this.logger.warn('Invalid result format or empty vms array');
      return [];
    }

    this.logger.debug(`Found ${result.vms.length} VMs to parse`);

    return result.vms.map((vm: any) => ({
      moid: vm.moid,
      name: vm.name,
      powerState: vm.powerState,
      guestOs: vm.guestOs,
      guestFamily: vm.guestFamily,
      version: vm.version,
      createDate: vm.createDate,
      numCoresPerSocket: vm.numCoresPerSocket,
      esxiHostName: vm.esxiHostName,
      esxiHostMoid: vm.esxiHostMoid,
      ip: vm.ip,
      hostname: vm.hostname,
      numCPU: vm.numCPU,
      memoryMB: vm.memoryMB,
      toolsStatus: vm.toolsStatus,
      annotation: vm.annotation,
    }));
  }

  private parseVmMetrics(result: any): VmwareVmMetrics {
    return {
      powerState: (result.powerState ?? 'poweredOff') as VmwarePowerState,
      guestState: (result.guestState ?? 'unknown') as VmwareGuestState,
      connectionState: (result.connectionState ??
        'disconnected') as VmwareConnectionState,
      guestHeartbeatStatus: (result.guestHeartbeatStatus ??
        'gray') as VmwareHealthStatus,
      overallStatus: (result.overallStatus ?? 'gray') as VmwareHealthStatus,
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

  private parseServerInfo(result: any): VmwareServerInfo {
    return {
      name: result.name ?? 'Unknown',
      vCenterIp: result.vCenterIp ?? '',
      cluster: result.cluster ?? '',
      vendor: result.vendor ?? 'Unknown',
      model: result.model ?? 'Unknown',
      ip: result.ip ?? '',
      cpuCores: result.cpuCores ?? 0,
      cpuThreads: result.cpuThreads ?? 0,
      cpuMHz: result.cpuMHz ?? 0,
      ramTotal: result.ramTotal ?? 0,
    };
  }

  private parseServerMetrics(result: any): VmwareServerMetrics {
    return {
      powerState: (result.powerState ?? 'poweredOff') as VmwareServerPowerState,
      overallStatus: (result.overallStatus ?? 'gray') as VmwareHealthStatus,
      rebootRequired: result.rebootRequired ?? false,
      cpuUsagePercent: result.cpuUsagePercent ?? 0,
      ramUsageMB: result.ramUsageMB ?? 0,
      uptime: result.uptime ?? 0,
      boottime: result.boottime ?? '',
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
    const httpCode = error.result?.httpCode ?? error.httpCode;

    if (httpCode === 401 || message.includes('Authentication failed')) {
      return new HttpException(
        'Invalid VMware credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (httpCode === 404 || message.includes('not found')) {
      return new HttpException('Resource not found', HttpStatus.NOT_FOUND);
    }

    if (httpCode === 403) {
      return new HttpException('Action forbidden', HttpStatus.FORBIDDEN);
    }

    if (message.includes('timeout')) {
      return new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    return new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private parseServerList(result: {
    servers?: RawVmwareServer[];
  }): VmwareServer[] {
    this.logger.debug('parseServerList input:', JSON.stringify(result));

    if (!result || !Array.isArray(result.servers)) {
      this.logger.warn('Invalid result format or empty servers array');
      return [];
    }

    this.logger.debug(`Found ${result.servers.length} servers to parse`);
    return result.servers.map((server) => ({
      name: server.name ?? 'Unknown',
      vCenterIp: server.vCenterIp ?? '',
      cluster: server.cluster ?? '',
      vendor: server.vendor ?? 'Unknown',
      model: server.model ?? 'Unknown',
      ip: server.ip ?? '',
      moid: server.moid ?? '',
      cpuCores: server.cpuCores ?? 0,
      cpuThreads: server.cpuThreads ?? 0,
      cpuMHz: server.cpuMHz ?? 0,
      ramTotal: server.ramTotal ?? 0,
    }));
  }

  /**
   * Ensure vCenter is initialized in Redis cache
   */
  private async ensureVcenterInitialized(): Promise<void> {
    if (this.vcenterInitialized) {
      return;
    }

    const servers = await this.serverRepository.findAll();
    await this.vmwareCacheService.initializeIfNeeded(servers);
    this.vcenterInitialized = true;
  }
}
