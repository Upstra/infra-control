import { Injectable } from '@nestjs/common';
import { VmResponseDto } from '../dto';
import { GetAllVmsAdminUseCase } from './get-all-vms-admin.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';

@Injectable()
export class GetAllVmsAdminWithMetricsUseCase {
  constructor(
    private readonly getAllVmsAdminUseCase: GetAllVmsAdminUseCase,
    private readonly enrichVmsWithMetricsUseCase: EnrichVmsWithMetricsUseCase,
  ) {}

  async execute(includeMetrics: boolean): Promise<VmResponseDto[]> {
    const vms = await this.getAllVmsAdminUseCase.execute();

    if (includeMetrics) {
      return this.enrichVmsWithMetricsUseCase.execute(vms);
    }

    return vms;
  }
}
