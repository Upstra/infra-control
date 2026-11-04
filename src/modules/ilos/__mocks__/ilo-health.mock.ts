import { IloHealth } from '../domain/interfaces/ilo-health.interface';

export const createIloHealth = (
  overrides: {
    inletC?: number | null;
    inletWarnC?: number | null;
    inletCritC?: number | null;
    health?: string | null;
    supplies?: IloHealth['power']['supplies'];
    consumedW?: number | null;
  } = {},
): IloHealth => ({
  collectedAt: '2026-11-04T20:06:58.000Z',
  generation: 'iLO 5',
  system: {
    model: 'ProLiant DL380 Gen11',
    serial: 'CZ2D1F0ABC',
    powerState: 'On',
    health: overrides.health === undefined ? 'OK' : overrides.health,
  },
  thermal: {
    inletC: overrides.inletC === undefined ? 24 : overrides.inletC,
    inletWarnC: overrides.inletWarnC === undefined ? 42 : overrides.inletWarnC,
    inletCritC: overrides.inletCritC === undefined ? 46 : overrides.inletCritC,
    maxCpuC: 68,
    sensors: [],
    fans: [],
  },
  power: {
    consumedW: overrides.consumedW === undefined ? 412 : overrides.consumedW,
    capacityW: 1600,
    supplies: overrides.supplies ?? [
      {
        name: 'PSU 1',
        state: 'Enabled',
        health: 'OK',
        capacityW: 800,
        outputW: 206,
      },
      {
        name: 'PSU 2',
        state: 'Enabled',
        health: 'OK',
        capacityW: 800,
        outputW: 206,
      },
    ],
  },
});
