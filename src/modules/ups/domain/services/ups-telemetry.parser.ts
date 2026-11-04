import {
  UpsTelemetry,
  UpsTelemetryElectrical,
} from '../interfaces/ups-telemetry.interface';

export type ParsedUpsOutput =
  | { kind: 'telemetry'; telemetry: UpsTelemetry }
  | { kind: 'minutes'; minutes: number };

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const toBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const toElectrical = (value: unknown): UpsTelemetryElectrical => {
  const record = asRecord(value);
  return {
    voltage: toNumber(record.voltage),
    frequencyHz: toNumber(record.frequencyHz),
  };
};

const parseMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return parseInt(trimmed, 10);
};

const unwrap = (raw: unknown): unknown => {
  const record = asRecord(raw);
  if (record.status === 'success' && typeof record.output === 'string') {
    return unwrapString(record.output);
  }
  if (typeof raw === 'string') return unwrapString(raw);
  return raw;
};

const unwrapString = (value: string): unknown => {
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return trimmed;
};

export function toUpsTelemetry(value: unknown): UpsTelemetry {
  const record = asRecord(value);
  const device = asRecord(record.device);
  const status = asRecord(record.status);
  const battery = asRecord(record.battery);
  const load = asRecord(record.load);
  return {
    source: toText(record.source) ?? 'unknown',
    collectedAt: toText(record.collectedAt) ?? new Date().toISOString(),
    device: {
      manufacturer: toText(device.manufacturer),
      model: toText(device.model),
      serial: toText(device.serial),
      firmware: toText(device.firmware),
    },
    status: {
      raw: toText(status.raw),
      onBattery: toBoolean(status.onBattery),
      lowBattery: toBoolean(status.lowBattery),
      charging: toBoolean(status.charging),
      onBypass: toBoolean(status.onBypass),
      overload: toBoolean(status.overload),
      replaceBattery: toBoolean(status.replaceBattery),
    },
    battery: {
      chargePercent: toNumber(battery.chargePercent),
      runtimeSeconds: toNumber(battery.runtimeSeconds),
      voltage: toNumber(battery.voltage),
      temperatureC: toNumber(battery.temperatureC),
      lastTestResult: toText(battery.lastTestResult),
      lastTestAt: toText(battery.lastTestAt),
    },
    input: toElectrical(record.input),
    output: toElectrical(record.output),
    load: {
      percent: toNumber(load.percent),
      realPowerW: toNumber(load.realPowerW),
      nominalRealPowerW: toNumber(load.nominalRealPowerW),
    },
    temperatureC: toNumber(record.temperatureC),
  };
}

export function parseUpsTelemetry(raw: unknown): ParsedUpsOutput | null {
  const value = unwrap(raw);
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { kind: 'minutes', minutes: value } : null;
  }
  if (typeof value === 'string') {
    const minutes = parseMinutes(value);
    return minutes === null ? null : { kind: 'minutes', minutes };
  }
  const record = asRecord(value);
  if (!('status' in record) && !('battery' in record)) return null;
  return { kind: 'telemetry', telemetry: toUpsTelemetry(record) };
}
