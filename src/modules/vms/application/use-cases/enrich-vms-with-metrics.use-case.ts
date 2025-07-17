import { Injectable, Logger } from '@nestjs/common';
import { VmResponseDto, VmMetricsDto } from '../dto';
import { GetVmMetricsUseCase } from '@/modules/vmware/application/use-cases/get-vm-metrics.use-case';

@Injectable()
export class EnrichVmsWithMetricsUseCase {
  private readonly logger = new Logger(EnrichVmsWithMetricsUseCase.name);

  constructor(
    private readonly getVmMetricsUseCase: GetVmMetricsUseCase,
  ) {}

  async execute(vms: VmResponseDto[]): Promise<VmResponseDto[]> {
    const enrichedVms: VmResponseDto[] = [];

    for (const vm of vms) {
      let metrics: VmMetricsDto | undefined;

      if (vm.serverId && vm.moid) {
        try {
          const vmwareMetrics = await this.getVmMetricsUseCase.execute(
            vm.serverId,
            vm.moid,
          );

          metrics = {
            cpuUsage: vmwareMetrics.overallCpuUsage ?? 0,
            memoryUsage: vmwareMetrics.guestMemoryUsage ?? 0,
            memoryMB: vmwareMetrics.maxMemoryUsage ?? 0,
            powerState: vmwareMetrics.powerState ?? 'unknown',
            guestToolsStatus: vmwareMetrics.guestHeartbeatStatus ?? 'unknown',
          };
        } catch (error) {
          this.logger.warn(
            `Failed to get metrics for VM ${vm.id}: ${error.message}`,
          );
        }
      }

      const enrichedVm: VmResponseDto = {
        ...vm,
        metrics,
      };

      enrichedVms.push(enrichedVm);
    }

    return enrichedVms;
  }
}