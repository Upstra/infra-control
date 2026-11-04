export interface UpsTelemetryDevice {
  manufacturer: string | null;
  model: string | null;
  serial: string | null;
  firmware: string | null;
}

export interface UpsTelemetryStatus {
  raw: string | null;
  onBattery: boolean | null;
  lowBattery: boolean | null;
  charging: boolean | null;
  onBypass: boolean | null;
  overload: boolean | null;
  replaceBattery: boolean | null;
}

export interface UpsTelemetryBattery {
  chargePercent: number | null;
  runtimeSeconds: number | null;
  voltage: number | null;
  temperatureC: number | null;
  lastTestResult: string | null;
  lastTestAt: string | null;
}

export interface UpsTelemetryElectrical {
  voltage: number | null;
  frequencyHz: number | null;
}

export interface UpsTelemetryLoad {
  percent: number | null;
  realPowerW: number | null;
  nominalRealPowerW: number | null;
}

export interface UpsTelemetry {
  source: string;
  collectedAt: string;
  device: UpsTelemetryDevice;
  status: UpsTelemetryStatus;
  battery: UpsTelemetryBattery;
  input: UpsTelemetryElectrical;
  output: UpsTelemetryElectrical;
  load: UpsTelemetryLoad;
  temperatureC: number | null;
}
