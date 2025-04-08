import { VmCreationDto } from '@/modules/vms/application/dto/vm.creation.dto';
import { VmResponseDto } from '@/modules/vms/application/dto/vm.response.dto';
import { VmUpdateDto } from '@/modules/vms/application/dto/vm.update.dto';

export interface VmEndpointInterface {
  getAllVms(): Promise<VmResponseDto[]>;
  getVmById(id: string): Promise<VmResponseDto>;
  createVm(vmDto: VmCreationDto): Promise<VmResponseDto>;
  updateVm(id: string, vmDto: VmUpdateDto): Promise<VmResponseDto>;
  deleteVm(id: string): Promise<void>;
}
