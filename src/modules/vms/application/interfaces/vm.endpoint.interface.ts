import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmUpdateDto } from '../dto/vm.update.dto';

export interface VmEndpointInterface {
  getAllVms(): Promise<VmResponseDto[]>;
  getVmById(id: string): Promise<VmResponseDto>;
  createVm(vmDto: VmCreationDto): Promise<VmResponseDto>;
  updateVm(id: string, vmDto: VmUpdateDto): Promise<VmResponseDto>;
  deleteVm(id: string): Promise<void>;
}
