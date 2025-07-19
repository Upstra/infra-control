import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionService } from '@/modules/vmware/domain/services/vmware-connection.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmPowerAction } from '../dto';

export interface VmPowerControlResult {
  success: boolean;
  message: string;
  newState: string;
}

@Injectable()
export class ControlVmPowerUseCase {
  constructor(
    private readonly vmwareService: VmwareService,
    private readonly vmwareConnectionService: VmwareConnectionService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(
    moid: string,
    action: VmPowerAction,
  ): Promise<VmPowerControlResult> {
    const vcenter = await this.serverRepository.findServerByTypeWithCredentials('vcenter');

    if (!vcenter) {
      throw new NotFoundException('vCenter server not found');
    }

    const connection = this.vmwareConnectionService.buildVmwareConnection(vcenter);

    let vmAction: 'on' | 'off';
    switch (action) {
      case VmPowerAction.POWER_ON:
        vmAction = 'on';
        break;
      case VmPowerAction.POWER_OFF:
      case VmPowerAction.RESET:
      case VmPowerAction.SUSPEND:
        vmAction = 'off';
        break;
      default:
        vmAction = 'off';
    }
    return await this.vmwareService.controlVMPower(moid, vmAction, connection);
  }
}
