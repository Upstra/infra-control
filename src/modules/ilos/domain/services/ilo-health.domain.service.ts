import { Injectable } from '@nestjs/common';
import {
  IloHealth,
  IloHealthSupply,
  InletLevel,
  InletThresholds,
  RoomInletThresholdsRef,
  ServerHardwareSummary,
} from '../interfaces/ilo-health.interface';

export const DEFAULT_INLET_WARN_C = 30;
export const DEFAULT_INLET_CRIT_C = 35;
export const INLET_HYSTERESIS_C = 1;
const HEALTHY = 'OK';
const ABSENT = 'Absent';

@Injectable()
export class IloHealthDomainService {
  inletThresholds(
    health: IloHealth,
    room?: RoomInletThresholdsRef | null,
  ): InletThresholds {
    if (room?.inletWarnC != null || room?.inletCritC != null) {
      return {
        warnC: room?.inletWarnC ?? room?.inletCritC ?? DEFAULT_INLET_WARN_C,
        critC: room?.inletCritC ?? DEFAULT_INLET_CRIT_C,
        source: 'room',
      };
    }
    const { inletWarnC, inletCritC } = health.thermal;
    if (inletWarnC !== null || inletCritC !== null) {
      return {
        warnC: inletWarnC ?? inletCritC ?? DEFAULT_INLET_WARN_C,
        critC: inletCritC ?? DEFAULT_INLET_CRIT_C,
        source: 'redfish',
      };
    }
    return {
      warnC: DEFAULT_INLET_WARN_C,
      critC: DEFAULT_INLET_CRIT_C,
      source: 'default',
    };
  }

  inletLevel(
    health: IloHealth,
    room?: RoomInletThresholdsRef | null,
  ): InletLevel {
    const inlet = health.thermal.inletC;
    if (inlet === null) return 'normal';
    const thresholds = this.inletThresholds(health, room);
    if (inlet >= thresholds.critC) return 'critical';
    if (inlet >= thresholds.warnC) return 'warning';
    return 'normal';
  }

  inletBackToNormal(
    health: IloHealth,
    room?: RoomInletThresholdsRef | null,
  ): boolean {
    const inlet = health.thermal.inletC;
    if (inlet === null) return true;
    return (
      inlet < this.inletThresholds(health, room).warnC - INLET_HYSTERESIS_C
    );
  }

  psuDegraded(health: IloHealth): boolean {
    const supplies = health.power.supplies;
    if (supplies.length < 2) return false;
    return supplies.some((supply) => !this.isSupplyOk(supply));
  }

  summarize(health: IloHealth): ServerHardwareSummary {
    const supplies = health.power.supplies;
    return {
      inletC: health.thermal.inletC,
      consumedW: health.power.consumedW,
      psu: {
        ok: supplies.filter((supply) => this.isSupplyOk(supply)).length,
        total: supplies.length,
      },
      health: health.system.health,
      collectedAt: health.collectedAt,
    };
  }

  private isSupplyOk(supply: IloHealthSupply): boolean {
    return supply.state !== ABSENT && supply.health === HEALTHY;
  }
}
