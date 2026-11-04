import {
  IloHealth,
  IloHealthFan,
  IloHealthSensor,
  IloHealthSupply,
} from '../interfaces/ilo-health.interface';

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {};

const list = (value: unknown): RawRecord[] =>
  Array.isArray(value) ? value.map(record) : [];

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

const sensor = (item: RawRecord): IloHealthSensor => ({
  name: text(item.name),
  readingC: num(item.readingC),
  warnC: num(item.warnC),
  critC: num(item.critC),
  state: text(item.state),
  health: text(item.health),
});

const fan = (item: RawRecord): IloHealthFan => ({
  name: text(item.name),
  percent: num(item.percent),
  state: text(item.state),
  health: text(item.health),
});

const supply = (item: RawRecord): IloHealthSupply => ({
  name: text(item.name),
  state: text(item.state),
  health: text(item.health),
  capacityW: num(item.capacityW),
  outputW: num(item.outputW),
});

export function parseIloHealth(raw: unknown): IloHealth | null {
  const root = record(raw);
  if (!('thermal' in root) && !('power' in root) && !('system' in root)) {
    return null;
  }
  const system = record(root.system);
  const thermal = record(root.thermal);
  const power = record(root.power);
  return {
    collectedAt: text(root.collectedAt) ?? new Date().toISOString(),
    generation: text(root.generation),
    system: {
      model: text(system.model),
      serial: text(system.serial),
      powerState: text(system.powerState),
      health: text(system.health),
    },
    thermal: {
      inletC: num(thermal.inletC),
      inletWarnC: num(thermal.inletWarnC),
      inletCritC: num(thermal.inletCritC),
      maxCpuC: num(thermal.maxCpuC),
      sensors: list(thermal.sensors).map(sensor),
      fans: list(thermal.fans).map(fan),
    },
    power: {
      consumedW: num(power.consumedW),
      capacityW: num(power.capacityW),
      supplies: list(power.supplies).map(supply),
    },
  };
}
