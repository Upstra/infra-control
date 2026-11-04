import { Injectable } from '@nestjs/common';
import { VmListResponseDto, VmResponseDto } from '../dto';
import { GetVmListUseCase } from './get-vm-list.use-case';
import { GetAllVmsUseCase } from './get-all-vms.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';

export type VmHealthFilter = 'issues';

const ISSUE_ORDER: Record<string, number> = {
  down: 0,
  unknown: 1,
  degraded: 2,
};

@Injectable()
export class GetVmListWithMetricsUseCase {
  constructor(
    private readonly getVmListUseCase: GetVmListUseCase,
    private readonly enrichVmsWithMetricsUseCase: EnrichVmsWithMetricsUseCase,
    private readonly getAllVmsUseCase: GetAllVmsUseCase,
  ) {}

  async execute(
    page: number,
    limit: number,
    includeMetrics: boolean,
    serverId?: string,
    health?: VmHealthFilter,
  ): Promise<VmListResponseDto> {
    if (health === 'issues') {
      return this.listIssues(page, limit, serverId);
    }

    const result = await this.getVmListUseCase.execute(page, limit, serverId);

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

  private async listIssues(
    page: number,
    limit: number,
    serverId?: string,
  ): Promise<VmListResponseDto> {
    const all = await this.getAllVmsUseCase.execute();
    const scoped = serverId
      ? all.filter((vm) => vm.serverId === serverId)
      : all;
    const enriched = await this.enrichVmsWithMetricsUseCase.execute(scoped);
    const issues = enriched
      .filter((vm) => vm.health !== undefined && vm.health !== 'up')
      .sort(
        (a, b) =>
          ISSUE_ORDER[a.health!] - ISSUE_ORDER[b.health!] ||
          a.name.localeCompare(b.name),
      );
    const items: VmResponseDto[] = issues.slice(
      (page - 1) * limit,
      page * limit,
    );
    return new VmListResponseDto(items, issues.length, page, limit);
  }
}
