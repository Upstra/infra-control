import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmHealthDomainService } from '../../domain/services/vm-health.domain.service';
import { VmwareTelemetryCacheService } from '../services/vmware-telemetry-cache.service';
import { CollectInventoryMetricsUseCase } from './collect-inventory-metrics.use-case';
import { HostMetricsResponseDto } from '../dto/host-metrics.response.dto';

@Injectable()
export class GetHostsMetricsUseCase {
  constructor(
    private readonly cache: VmwareTelemetryCacheService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly healthService: VmHealthDomainService,
    private readonly collectMetrics: CollectInventoryMetricsUseCase,
  ) {}

  async execute(): Promise<HostMetricsResponseDto[]> {
    const [hosts, servers] = await Promise.all([
      this.cache.getHosts(),
      this.serverRepository.findAll(),
    ]);
    const serversByMoid = new Map(
      servers
        .filter((server) => server.vmwareHostMoid)
        .map((server) => [server.vmwareHostMoid!, server]),
    );
    const interval = this.collectMetrics.intervalSeconds();

    return Object.values(hosts)
      .map((host) => {
        const server = serversByMoid.get(host.moid);
        return {
          moid: host.moid,
          name: host.name,
          serverId: server?.id ?? null,
          upsId: server?.upsId ?? null,
          health: this.healthService.isStale(host.metricsAt, interval)
            ? ('unknown' as const)
            : host.health,
          connectionState: host.connectionState,
          powerState: host.powerState,
          maintenance: host.maintenance,
          cpuPercent: host.cpuPercent,
          memoryPercent: host.memoryPercent,
          uptimeSeconds: host.uptimeSeconds,
          metricsAt: host.metricsAt,
        };
      })
      .sort((a, b) => (a.name ?? a.moid).localeCompare(b.name ?? b.moid));
  }
}
