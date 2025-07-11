import { Injectable } from '@nestjs/common';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmPowerActionDto } from '../dto';

export interface VmPowerControlResult {
  success: boolean;
  message: string;
  newState: string;
}

@Injectable()
export class ControlVmPowerUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(moid: string, dto: VmPowerActionDto): Promise<VmPowerControlResult> {
    return await this.vmwareService.controlVMPower(
      moid,
      dto.action,
      dto.connection,
    );
  }
}