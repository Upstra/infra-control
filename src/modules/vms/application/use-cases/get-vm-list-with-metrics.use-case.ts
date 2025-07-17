import { Injectable } from '@nestjs/common';
import { VmListResponseDto } from '../dto';
import { GetVmListUseCase } from './get-vm-list.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';

@Injectable()
export class GetVmListWithMetricsUseCase {
  constructor(
    private readonly getVmListUseCase: GetVmListUseCase,
    private readonly enrichVmsWithMetricsUseCase: EnrichVmsWithMetricsUseCase,
  ) {}

  async execute(
    page: number,
    limit: number,
    includeMetrics: boolean,
  ): Promise<VmListResponseDto> {
    const result = await this.getVmListUseCase.execute(page, limit);

    if (includeMetrics && result.items.length > 0) {
      const enrichedVms = await this.enrichVmsWithMetricsUseCase.execute(
        result.items,
      );
      return {
        ...result,
        items: enrichedVms,
      };
    }

    return result;
  }
}
