import { UpsTelemetry } from '../interfaces/ups-telemetry.interface';

export type NominalPowerSource = 'device' | 'manual' | null;

export interface EffectiveNominalPower {
  effectiveNominalPowerW: number | null;
  nominalPowerSource: NominalPowerSource;
}

export function effectiveNominalPower(
  manualNominalPowerW: number | null | undefined,
  telemetry: UpsTelemetry | null | undefined,
): EffectiveNominalPower {
  const device = telemetry?.load.nominalRealPowerW ?? null;
  if (device !== null) {
    return { effectiveNominalPowerW: device, nominalPowerSource: 'device' };
  }
  if (manualNominalPowerW !== null && manualNominalPowerW !== undefined) {
    return {
      effectiveNominalPowerW: manualNominalPowerW,
      nominalPowerSource: 'manual',
    };
  }
  return { effectiveNominalPowerW: null, nominalPowerSource: null };
}
