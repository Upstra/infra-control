import { Injectable } from '@nestjs/common';
import {
  PowerOffCause,
  VcenterEvent,
} from '../interfaces/vmware-telemetry.interface';

export const HA_EVENT_PREFIX = 'com.vmware.vc.ha.';
export const HA_NEIGHBOUR_WINDOW_MS = 10_000;

export interface PowerOffContext {
  neighbours: VcenterEvent[];
  serviceAccounts: string[];
  upstraPlanActive: boolean;
}

@Injectable()
export class PowerOffCauseDomainService {
  determine(event: VcenterEvent, context: PowerOffContext): PowerOffCause {
    const at = event.createdAt;
    if (
      this.isHaEvent(event) ||
      this.hasHaNeighbour(event, context.neighbours)
    ) {
      return { at, cause: 'ha', by: null };
    }
    if (
      context.upstraPlanActive ||
      this.isServiceAccount(event.userName, context.serviceAccounts)
    ) {
      return { at, cause: 'upstra', by: event.userName };
    }
    return { at, cause: 'manual', by: event.userName };
  }

  isHaEvent(event: VcenterEvent): boolean {
    return event.type.startsWith(HA_EVENT_PREFIX);
  }

  isNeighbour(a: VcenterEvent, b: VcenterEvent): boolean {
    if (!a.vmMoid || a.vmMoid !== b.vmMoid) return false;
    const delta = Math.abs(
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return delta <= HA_NEIGHBOUR_WINDOW_MS;
  }

  normalizeAccount(name: string | null | undefined): string | null {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    const withoutDomain = lower.includes('\\')
      ? lower.split('\\').pop()!
      : lower;
    return withoutDomain.split('@')[0] || null;
  }

  private hasHaNeighbour(
    event: VcenterEvent,
    neighbours: VcenterEvent[],
  ): boolean {
    return neighbours.some(
      (other) =>
        other.key !== event.key &&
        this.isHaEvent(other) &&
        this.isNeighbour(event, other),
    );
  }

  private isServiceAccount(
    userName: string | null,
    accounts: string[],
  ): boolean {
    const normalized = this.normalizeAccount(userName);
    if (!normalized) return false;
    return accounts.some(
      (account) => this.normalizeAccount(account) === normalized,
    );
  }
}
