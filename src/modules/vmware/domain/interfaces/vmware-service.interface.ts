import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import { VmwareVm, VmwareVmMetrics, VmwareHost } from './vmware-vm.interface';

export interface IVmwareService {
  listVMs(connection: VmwareConnectionDto): Promise<VmwareVm[]>;
  getVMMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareVmMetrics>;
  controlVMPower(
    moid: string,
    action: 'on' | 'off',
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newState: string }>;
  migrateVM(
    vmMoid: string,
    destinationMoid: string,
    connection: VmwareConnectionDto,
  ): Promise<{ success: boolean; message: string; newHost: string }>;
  getHostMetrics(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareHost>;
}
