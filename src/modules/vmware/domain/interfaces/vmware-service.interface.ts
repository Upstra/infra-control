import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import {
  VmwareVm,
  VmwareVmMetrics,
  VmwareHost,
  VmwareServerInfo,
  VmwareServerMetrics,
  VmwarePowerState,
  VmwareServer,
} from './vmware-vm.interface';

export interface IVmwareService {
  listVMs(connection: VmwareConnectionDto): Promise<VmwareVm[]>;
  listServers(connection: VmwareConnectionDto): Promise<VmwareServer[]>;
  getVMMetrics(
    moid: string,
    connection: VmwareConnectionDto,
    force?: boolean,
  ): Promise<VmwareVmMetrics>;
  controlVMPower(
    moid: string,
    action: 'on' | 'off',
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newState: VmwarePowerState }>;
  migrateVM(
    vmMoid: string,
    destinationMoid: string,
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newHost: string }>;
  getServerInfo(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareServerInfo>;
  getServerMetrics(
    moid: string,
    connection: VmwareConnectionDto,
    force?: boolean,
  ): Promise<VmwareServerMetrics>;
  getHostMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareHost>;
}
