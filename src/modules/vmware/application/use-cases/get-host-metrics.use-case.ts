import { Injectable } from '@nestjs/common';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionDto } from '../dto';
import { VmwareHost } from '@/modules/vmware/domain/interfaces';

@Injectable()
export class GetHostMetricsUseCase {
  constructor(private readonly vmwareService: VmwareService) {}

  async execute(
    moid: string,
    connection: VmwareConnectionDto,
  ): Promise<VmwareHost> {
    return await this.vmwareService.getHostMetrics(moid, connection);
  }
}
