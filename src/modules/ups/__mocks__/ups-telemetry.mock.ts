import { UPSBatteryStatusDto } from '../domain/interfaces/ups-battery-status.interface';
import { UpsTelemetry } from '../domain/interfaces/ups-telemetry.interface';

export const createMockUpsTelemetry = (
  overrides: Partial<UpsTelemetry> = {},
): UpsTelemetry => ({
  source: 'nut',
  collectedAt: '2026-11-04T20:01:44.000Z',
  device: {
    manufacturer: 'APC',
    model: 'Smart-UPS SRT 3000',
    serial: null,
    firmware: null,
  },
  status: {
    raw: 'OL',
    onBattery: false,
    lowBattery: false,
    charging: false,
    onBypass: false,
    overload: false,
    replaceBattery: false,
  },
  battery: {
    chargePercent: 100,
    runtimeSeconds: 3600,
    voltage: null,
    temperatureC: null,
    lastTestResult: null,
    lastTestAt: null,
  },
  input: { voltage: 230, frequencyHz: 50 },
  output: { voltage: 230, frequencyHz: 50 },
  load: { percent: 40, realPowerW: 1200, nominalRealPowerW: 3000 },
  temperatureC: 28,
  ...overrides,
});

export const createMockBatteryStatus = (
  overrides: Partial<UPSBatteryStatusDto> = {},
): UPSBatteryStatusDto => ({
  upsId: 'ups-1',
  ip: '192.168.1.50',
  minutesRemaining: 60,
  hoursRemaining: 1,
  alertLevel: 'normal',
  statusLabel: 'Sur secteur',
  timestamp: new Date('2026-11-04T20:01:44.000Z'),
  telemetry: null,
  onBattery: null,
  batteryPercentage: null,
  loadPercent: null,
  ...overrides,
});
