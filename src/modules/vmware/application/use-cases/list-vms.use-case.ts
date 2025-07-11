import { Injectable } from '@nestjs/common';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionDto } from '../dto';
import { VmwareVm } from '@/modules/vmware/domain/interfaces';

@Injectable()
export class ListVmsUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(connection: VmwareConnectionDto): Promise<{ vms: VmwareVm[] }> {
    const vms = await this.vmwareService.listVMs(connection);
    return { vms };
  }
}