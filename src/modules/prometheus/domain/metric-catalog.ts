export type MetricScope = 'total' | 'ups' | 'server' | 'host';
export type MetricRange = '1h' | '24h' | '7d';

export interface MetricDefinition {
  name: string;
  unit: string;
  aggregate: 'sum' | 'avg' | 'max' | 'min';
  scopes: MetricScope[];
  seriesLabel?: string;
}

export const METRIC_NAMES = {
  upsCharge: 'upstra_ups_battery_charge_percent',
  upsRuntime: 'upstra_ups_runtime_seconds',
  upsOnBattery: 'upstra_ups_on_battery',
  upsLoad: 'upstra_ups_load_percent',
  upsRealPower: 'upstra_ups_real_power_watts',
  upsInputVoltage: 'upstra_ups_input_voltage_volts',
  upsTemperature: 'upstra_ups_temperature_celsius',
  hostCpu: 'upstra_host_cpu_percent',
  hostMemory: 'upstra_host_memory_percent',
  serverInlet: 'upstra_server_inlet_celsius',
  serverPower: 'upstra_server_power_watts',
  alertsOpen: 'upstra_alerts_open',
} as const;

const UPS_SCOPES: MetricScope[] = ['total', 'ups'];
const SERVER_SCOPES: MetricScope[] = ['total', 'server'];

export const METRIC_CATALOG: Record<string, MetricDefinition> = {
  ups_battery_charge: {
    name: METRIC_NAMES.upsCharge,
    unit: '%',
    aggregate: 'avg',
    scopes: UPS_SCOPES,
    seriesLabel: 'ups_name',
  },
  ups_runtime: {
    name: METRIC_NAMES.upsRuntime,
    unit: 's',
    aggregate: 'min',
    scopes: UPS_SCOPES,
    seriesLabel: 'ups_name',
  },
  ups_load: {
    name: METRIC_NAMES.upsLoad,
    unit: '%',
    aggregate: 'avg',
    scopes: UPS_SCOPES,
    seriesLabel: 'ups_name',
  },
  ups_real_power: {
    name: METRIC_NAMES.upsRealPower,
    unit: 'W',
    aggregate: 'sum',
    scopes: UPS_SCOPES,
    seriesLabel: 'ups_name',
  },
  ups_input_voltage: {
    name: METRIC_NAMES.upsInputVoltage,
    unit: 'V',
    aggregate: 'avg',
    scopes: UPS_SCOPES,
    seriesLabel: 'ups_name',
  },
  host_cpu: {
    name: METRIC_NAMES.hostCpu,
    unit: '%',
    aggregate: 'avg',
    scopes: ['total', 'host'],
    seriesLabel: 'host_name',
  },
  server_inlet: {
    name: METRIC_NAMES.serverInlet,
    unit: '°C',
    aggregate: 'max',
    scopes: SERVER_SCOPES,
    seriesLabel: 'server_name',
  },
  server_power: {
    name: METRIC_NAMES.serverPower,
    unit: 'W',
    aggregate: 'sum',
    scopes: SERVER_SCOPES,
    seriesLabel: 'server_name',
  },
  total_power: {
    name: METRIC_NAMES.upsRealPower,
    unit: 'W',
    aggregate: 'sum',
    scopes: ['total'],
  },
};

export const SCOPE_ID_LABEL: Record<Exclude<MetricScope, 'total'>, string> = {
  ups: 'ups_id',
  server: 'server_id',
  host: 'host_moid',
};

export const RANGE_SETTINGS: Record<
  MetricRange,
  { seconds: number; step: number }
> = {
  '1h': { seconds: 3600, step: 15 },
  '24h': { seconds: 86400, step: 120 },
  '7d': { seconds: 604800, step: 900 },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOID_PATTERN = /^host-\d+$/;

export function isValidScopeId(
  scope: MetricScope,
  id: string | undefined,
): boolean {
  if (scope === 'total') return true;
  if (!id) return false;
  return scope === 'host' ? MOID_PATTERN.test(id) : UUID_PATTERN.test(id);
}

export function buildPromQuery(
  definition: MetricDefinition,
  scope: MetricScope,
  id?: string,
): string {
  if (scope === 'total') {
    return `${definition.aggregate}(${definition.name})`;
  }
  return `${definition.name}{${SCOPE_ID_LABEL[scope]}="${id}"}`;
}
