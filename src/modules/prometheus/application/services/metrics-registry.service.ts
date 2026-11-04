import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Gauge, register } from 'prom-client';
import { UpsBatteryEvents } from '@/modules/ups/domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '@/modules/ups/domain/interfaces/ups-battery-status.interface';
import {
  VmwareMetricsCollectedEvent,
  VmwareTelemetryEvents,
} from '@/modules/vmware/domain/events/vmware-telemetry.events';
import {
  IloHealthCheckedEvent,
  IloHealthEvents,
} from '@/modules/ilos/domain/events/ilo-health.events';
import { SERVER_DELETED_EVENT } from '@/modules/servers/application/use-cases/delete-server.use-case';
import {
  AlertEvents,
  AlertSummaryChangedEvent,
} from '@/modules/alerts/domain/events/alert.events';
import { METRIC_NAMES } from '../../domain/metric-catalog';

type Labels = Record<string, string>;

const UPS_LABELS = ['ups_id', 'ups_name', 'room_id'];
const HOST_LABELS = ['host_moid', 'host_name'];
const SERVER_LABELS = ['server_id', 'server_name', 'room_id'];

@Injectable()
export class MetricsRegistryService {
  private readonly upsGauges: Record<string, Gauge>;
  private readonly hostGauges: Record<string, Gauge>;
  private readonly serverGauges: Record<string, Gauge>;
  private readonly alertsOpen: Gauge;
  private readonly upsLabels = new Map<string, Labels>();
  private readonly hostLabels = new Map<string, Labels>();
  private readonly serverLabels = new Map<string, Labels>();

  constructor() {
    const gauge = (name: string, help: string, labelNames: string[]) =>
      (register.getSingleMetric(name) as Gauge) ??
      new Gauge({ name, help, labelNames });

    this.upsGauges = {
      charge: gauge(
        METRIC_NAMES.upsCharge,
        'UPS battery charge in percent',
        UPS_LABELS,
      ),
      runtime: gauge(
        METRIC_NAMES.upsRuntime,
        'UPS estimated runtime in seconds',
        UPS_LABELS,
      ),
      onBattery: gauge(
        METRIC_NAMES.upsOnBattery,
        '1 when the UPS runs on battery',
        UPS_LABELS,
      ),
      load: gauge(
        METRIC_NAMES.upsLoad,
        'UPS output load in percent',
        UPS_LABELS,
      ),
      realPower: gauge(
        METRIC_NAMES.upsRealPower,
        'UPS output real power in watts',
        UPS_LABELS,
      ),
      inputVoltage: gauge(
        METRIC_NAMES.upsInputVoltage,
        'UPS input voltage in volts',
        UPS_LABELS,
      ),
      temperature: gauge(
        METRIC_NAMES.upsTemperature,
        'UPS temperature in celsius',
        UPS_LABELS,
      ),
    };
    this.hostGauges = {
      cpu: gauge(
        METRIC_NAMES.hostCpu,
        'ESXi host CPU usage in percent',
        HOST_LABELS,
      ),
      memory: gauge(
        METRIC_NAMES.hostMemory,
        'ESXi host memory usage in percent',
        HOST_LABELS,
      ),
    };
    this.serverGauges = {
      inlet: gauge(
        METRIC_NAMES.serverInlet,
        'Server inlet air temperature in celsius',
        SERVER_LABELS,
      ),
      power: gauge(
        METRIC_NAMES.serverPower,
        'Server power draw in watts',
        SERVER_LABELS,
      ),
    };
    this.alertsOpen = gauge(
      METRIC_NAMES.alertsOpen,
      'Open alerts by severity',
      ['severity'],
    );
  }

  @OnEvent(UpsBatteryEvents.BATTERY_CHECKED)
  handleUpsChecked(status: UPSBatteryStatusDto): void {
    const labels = this.track(this.upsLabels, this.upsGauges, status.upsId, {
      ups_id: status.upsId,
      ups_name: status.upsName ?? status.ip,
      room_id: status.roomId ?? '',
    });
    const telemetry = status.telemetry;
    this.set(this.upsGauges.charge, labels, status.batteryPercentage);
    this.set(
      this.upsGauges.runtime,
      labels,
      telemetry?.battery.runtimeSeconds ?? null,
    );
    this.set(
      this.upsGauges.onBattery,
      labels,
      status.onBattery === null ? null : Number(status.onBattery),
    );
    this.set(this.upsGauges.load, labels, status.loadPercent);
    this.set(
      this.upsGauges.realPower,
      labels,
      telemetry?.load.realPowerW ?? null,
    );
    this.set(
      this.upsGauges.inputVoltage,
      labels,
      telemetry?.input.voltage ?? null,
    );
    this.set(
      this.upsGauges.temperature,
      labels,
      telemetry?.temperatureC ?? null,
    );
  }

  @OnEvent(UpsBatteryEvents.DELETED)
  handleUpsDeleted({ upsId }: { upsId: string }): void {
    this.forget(this.upsLabels, this.upsGauges, upsId);
  }

  @OnEvent(VmwareTelemetryEvents.METRICS_COLLECTED)
  handleVmwareMetrics(event: VmwareMetricsCollectedEvent): void {
    const seen = new Set<string>();
    event.hosts.forEach((host) => {
      seen.add(host.moid);
      const labels = this.track(this.hostLabels, this.hostGauges, host.moid, {
        host_moid: host.moid,
        host_name: host.name ?? host.moid,
      });
      this.set(this.hostGauges.cpu, labels, host.cpuPercent);
      this.set(this.hostGauges.memory, labels, host.memoryPercent);
    });
    [...this.hostLabels.keys()]
      .filter((moid) => !seen.has(moid))
      .forEach((moid) => this.forget(this.hostLabels, this.hostGauges, moid));
  }

  @OnEvent(IloHealthEvents.CHECKED)
  handleIloHealth(event: IloHealthCheckedEvent): void {
    const labels = this.track(
      this.serverLabels,
      this.serverGauges,
      event.serverId,
      {
        server_id: event.serverId,
        server_name: event.serverName,
        room_id: event.roomId ?? '',
      },
    );
    this.set(this.serverGauges.inlet, labels, event.health.thermal.inletC);
    this.set(this.serverGauges.power, labels, event.health.power.consumedW);
  }

  @OnEvent(SERVER_DELETED_EVENT)
  handleServerDeleted({ serverId }: { serverId: string }): void {
    this.forget(this.serverLabels, this.serverGauges, serverId);
  }

  @OnEvent(AlertEvents.SUMMARY_CHANGED)
  handleAlertSummary(summary: AlertSummaryChangedEvent): void {
    Object.entries(summary.open).forEach(([severity, count]) =>
      this.alertsOpen.set({ severity }, count),
    );
  }

  private set(gauge: Gauge, labels: Labels, value: number | null): void {
    if (value === null || value === undefined || Number.isNaN(value)) {
      gauge.remove(labels);
      return;
    }
    gauge.set(labels, value);
  }

  private track(
    known: Map<string, Labels>,
    gauges: Record<string, Gauge>,
    id: string,
    labels: Labels,
  ): Labels {
    const previous = known.get(id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(labels)) {
      Object.values(gauges).forEach((gauge) => gauge.remove(previous));
    }
    known.set(id, labels);
    return labels;
  }

  private forget(
    known: Map<string, Labels>,
    gauges: Record<string, Gauge>,
    id: string,
  ): void {
    const labels = known.get(id);
    if (!labels) return;
    Object.values(gauges).forEach((gauge) => gauge.remove(labels));
    known.delete(id);
  }
}
