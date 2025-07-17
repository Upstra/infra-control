import { Injectable } from '@nestjs/common';
import { VmResponseDto } from '../dto';
import { GetVmByIdUseCase } from './get-vm-by-id.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';

@Injectable()
export class GetVmByIdWithMetricsUseCase {
  constructor(
    private readonly getVmByIdUseCase: GetVmByIdUseCase,
    private readonly enrichVmsWithMetricsUseCase: EnrichVmsWithMetricsUseCase,
  ) {}

  async execute(id: string, includeMetrics: boolean): Promise<VmResponseDto> {
    const vm = await this.getVmByIdUseCase.execute(id);
    
    if (includeMetrics) {
      const enrichedVms = await this.enrichVmsWithMetricsUseCase.execute([vm]);
      return enrichedVms[0];
    }
    
    return vm;
  }
}