import { Injectable } from '@nestjs/common';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionDto } from '../dto';
import { VmwareVmMetrics } from '@/modules/vmware/domain/interfaces';

@Injectable()
export class GetVmMetricsUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(moid: string, connection: VmwareConnectionDto): Promise<VmwareVmMetrics> {
    return await this.vmwareService.getVMMetrics(moid, connection);
  }
}