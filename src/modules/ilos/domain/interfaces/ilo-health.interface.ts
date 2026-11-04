export interface IloHealthSensor {
  name: string | null;
  readingC: number | null;
  warnC: number | null;
  critC: number | null;
  state: string | null;
  health: string | null;
}

export interface IloHealthFan {
  name: string | null;
  percent: number | null;
  state: string | null;
  health: string | null;
}

export interface IloHealthSupply {
  name: string | null;
  state: string | null;
  health: string | null;
  capacityW: number | null;
  outputW: number | null;
}

export interface IloHealth {
  collectedAt: string;
  generation: string | null;
  system: {
    model: string | null;
    serial: string | null;
    powerState: string | null;
    health: string | null;
  };
  thermal: {
    inletC: number | null;
    inletWarnC: number | null;
    inletCritC: number | null;
    maxCpuC: number | null;
    sensors: IloHealthSensor[];
    fans: IloHealthFan[];
  };
  power: {
    consumedW: number | null;
    capacityW: number | null;
    supplies: IloHealthSupply[];
  };
}

export interface RoomInletThresholdsRef {
  inletWarnC?: number | null;
  inletCritC?: number | null;
}

export type InletLevel = 'normal' | 'warning' | 'critical';

export interface InletThresholds {
  warnC: number;
  critC: number;
  source: 'room' | 'redfish' | 'default';
}

export interface ServerHardwareSummary {
  inletC: number | null;
  consumedW: number | null;
  psu: { ok: number; total: number };
  health: string | null;
  collectedAt: string;
}
