import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { VmwareTelemetryCacheService } from '@/modules/vmware/application/services/vmware-telemetry-cache.service';
import { VmHealthDomainService } from '@/modules/vmware/domain/services/vm-health.domain.service';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '@/modules/ups/application/services/ups-battery-cache.service';
import { effectiveNominalPower } from '@/modules/ups/domain/services/ups-power';
import { GetHardwareEnvironmentUseCase } from '@/modules/ilos/application/use-cases/get-hardware-environment.use-case';
import { GetAlertSummaryUseCase } from '@/modules/alerts/application/use-cases/get-alert-summary.use-case';
import { ALERT_SUMMARY_CACHE_KEY } from '@/modules/alerts/application/listeners/alert-summary.publisher';
import { AlertSummaryResponseDto } from '@/modules/alerts/application/dto/alert.response.dto';
import {
  InfrastructureKpisDto,
  OpenAlertsCountDto,
  VmsByHealthDto,
} from '../dto/infrastructure-kpis.dto';

const DEFAULT_METRICS_INTERVAL_SECONDS = 60;

@Injectable()
export class GetInfrastructureKpisUseCase {
  constructor(
    private readonly vmwareCache: VmwareTelemetryCacheService,
    private readonly vmHealth: VmHealthDomainService,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsBatteryCache: UpsBatteryCacheService,
    private readonly hardwareEnvironment: GetHardwareEnvironmentUseCase,
    private readonly redis: RedisSafeService,
    private readonly getAlertSummary: GetAlertSummaryUseCase,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<InfrastructureKpisDto> {
    const [hosts, vms, power, environment, openAlerts] = await Promise.all([
      this.vmwareCache.getHosts(),
      this.vmwareCache.getVms(),
      this.power(),
      this.hardwareEnvironment.global(),
      this.openAlerts(),
    ]);
    const hostList = Object.values(hosts);

    return {
      hostsTotal: hostList.length,
      hostsConnected: hostList.filter(
        (host) => host.connectionState === 'connected',
      ).length,
      vmsByHealth: this.countVms(Object.values(vms)),
      ...power,
      maxInletC: environment.maxInletC,
      maxInletRoomId: environment.maxInletRoomId,
      maxInletServerName: environment.maxInletServerName,
      openAlerts,
    };
  }

  private countVms(
    vms: Array<{ health: keyof VmsByHealthDto; metricsAt: string }>,
  ): VmsByHealthDto {
    const interval = Number(
      this.configService.get('VMWARE_METRICS_INTERVAL_SECONDS') ??
        DEFAULT_METRICS_INTERVAL_SECONDS,
    );
    const counts: VmsByHealthDto = { up: 0, degraded: 0, down: 0, unknown: 0 };
    vms.forEach((vm) => {
      const health = this.vmHealth.isStale(vm.metricsAt, interval)
        ? 'unknown'
        : vm.health;
      counts[health]++;
    });
    return counts;
  }

  private async power(): Promise<
    Pick<
      InfrastructureKpisDto,
      'totalPowerW' | 'totalCapacityW' | 'upsOnBattery'
    >
  > {
    const upsList = await this.upsRepository.findAll();
    const statuses = await this.upsBatteryCache.getMultiple(
      upsList.map((ups) => ups.id),
    );
    const realPowers: number[] = [];
    const capacities: Array<number | null> = [];
    let upsOnBattery = 0;

    upsList.forEach((ups) => {
      const status = statuses[ups.id] ?? null;
      const telemetry = status?.telemetry ?? null;
      if (status?.onBattery === true) upsOnBattery++;
      if (telemetry?.load.realPowerW != null) {
        realPowers.push(telemetry.load.realPowerW);
      }
      capacities.push(
        effectiveNominalPower(ups.nominalPowerW, telemetry)
          .effectiveNominalPowerW,
      );
    });

    return {
      totalPowerW:
        realPowers.length === 0
          ? null
          : realPowers.reduce((sum, value) => sum + value, 0),
      totalCapacityW:
        capacities.length === 0 || capacities.some((value) => value === null)
          ? null
          : (capacities as number[]).reduce((sum, value) => sum + value, 0),
      upsOnBattery,
    };
  }

  private async openAlerts(): Promise<OpenAlertsCountDto> {
    const cached = await this.redis.safeGet(ALERT_SUMMARY_CACHE_KEY);
    if (cached) {
      return (JSON.parse(cached) as AlertSummaryResponseDto).open;
    }
    return (await this.getAlertSummary.execute()).open;
  }
}
