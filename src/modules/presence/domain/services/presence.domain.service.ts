import { Injectable } from '@nestjs/common';
import {
  PresenceRecord,
  PresenceStatus,
  PresenceView,
  PresenceViewer,
} from '../interfaces/presence.interface';

export const IDLE_AFTER_MS = 2 * 60 * 1000;
const MAX_ROUTE_LENGTH = 512;
const MAX_TITLE_LENGTH = 255;

@Injectable()
export class PresenceDomainService {
  status(record: PresenceRecord, now = Date.now()): PresenceStatus {
    const last = record.lastActivityAt
      ? new Date(record.lastActivityAt).getTime()
      : Number.NaN;
    return !Number.isNaN(last) && now - last < IDLE_AFTER_MS
      ? 'active'
      : 'idle';
  }

  canSeeActivity(viewer: PresenceViewer | null | undefined): boolean {
    return !!viewer?.userId && viewer.isActive !== false;
  }

  toView(
    userId: string,
    record: PresenceRecord | null,
    showActivity: boolean,
    now = Date.now(),
  ): PresenceView {
    if (!record) {
      return {
        userId,
        online: false,
        status: null,
        route: null,
        title: null,
        lastActivityAt: null,
      };
    }
    return {
      userId,
      online: true,
      status: this.status(record, now),
      route: showActivity ? record.route : null,
      title: showActivity ? record.title : null,
      lastActivityAt: showActivity ? record.lastActivityAt : null,
    };
  }

  sanitizeRoute(route: unknown): string | null | undefined {
    if (route === undefined) return undefined;
    if (typeof route !== 'string' || !route.startsWith('/')) return null;
    return route.slice(0, MAX_ROUTE_LENGTH);
  }

  sanitizeTitle(title: unknown): string | null | undefined {
    if (title === undefined) return undefined;
    if (typeof title !== 'string') return null;
    return title.slice(0, MAX_TITLE_LENGTH);
  }
}
