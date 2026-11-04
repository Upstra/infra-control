import { parseIloHealth } from '../ilo-health.parser';

const output = {
  collectedAt: '2026-11-04T20:06:58.000Z',
  generation: 'iLO 5',
  system: {
    model: 'ProLiant DL380 Gen11',
    serial: 'CZ2D1F0ABC',
    powerState: 'On',
    health: 'Warning',
  },
  thermal: {
    inletC: 31,
    inletWarnC: 42,
    inletCritC: 46,
    maxCpuC: 68,
    sensors: [
      {
        name: '01-Inlet Ambient',
        readingC: 31,
        warnC: 42,
        critC: 46,
        health: 'OK',
      },
    ],
    fans: [{ name: 'Fan 1', percent: 34, health: 'OK' }],
  },
  power: {
    consumedW: 412,
    capacityW: 1600,
    supplies: [
      {
        name: 'PSU 1',
        state: 'Enabled',
        health: 'OK',
        capacityW: 800,
        outputW: 412,
      },
      {
        name: 'PSU 2',
        state: 'Absent',
        health: null,
        capacityW: null,
        outputW: null,
      },
    ],
  },
};

describe('parseIloHealth', () => {
  it('parses a complete ilo_health output', () => {
    const health = parseIloHealth(output);

    expect(health?.thermal.inletC).toBe(31);
    expect(health?.system.health).toBe('Warning');
    expect(health?.power.consumedW).toBe(412);
    expect(health?.thermal.fans[0].percent).toBe(34);
  });

  it('keeps inletC null when the inlet sensor is missing', () => {
    const health = parseIloHealth({
      ...output,
      thermal: { ...output.thermal, inletC: null, sensors: [] },
    });

    expect(health?.thermal.inletC).toBeNull();
    expect(parseIloHealth('garbage')).toBeNull();
  });

  it('keeps an absent PSU in the list', () => {
    const supplies = parseIloHealth(output)?.power.supplies;

    expect(supplies).toHaveLength(2);
    expect(supplies?.[1]).toEqual({
      name: 'PSU 2',
      state: 'Absent',
      health: null,
      capacityW: null,
      outputW: null,
    });
  });
});
