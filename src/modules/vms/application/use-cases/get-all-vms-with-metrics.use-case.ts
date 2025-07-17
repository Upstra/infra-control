import { Injectable } from '@nestjs/common';
import { VmResponseDto } from '../dto';
import { GetAllVmsUseCase } from './get-all-vms.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';

@Injectable()
export class GetAllVmsWithMetricsUseCase {
  constructor(
    private readonly getAllVmsUseCase: GetAllVmsUseCase,
    private readonly enrichVmsWithMetricsUseCase: EnrichVmsWithMetricsUseCase,
  ) {}

  async execute(includeMetrics: boolean): Promise<VmResponseDto[]> {
    const vms = await this.getAllVmsUseCase.execute();
    
    if (includeMetrics) {
      return this.enrichVmsWithMetricsUseCase.execute(vms);
    }
    
    return vms;
  }
}