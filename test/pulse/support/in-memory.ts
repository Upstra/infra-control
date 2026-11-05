import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Alert } from '@/modules/alerts/domain/entities/alert.entity';
import { AlertTransition } from '@/modules/alerts/domain/entities/alert-transition.entity';
import {
  AlertListFilters,
  AlertRepositoryInterface,
  OpenAlertCounts,
} from '@/modules/alerts/domain/interfaces/alert.repository.interface';
import {
  AlertTransitionFeedQuery,
  AlertTransitionRepositoryInterface,
} from '@/modules/alerts/domain/interfaces/alert-transition.repository.interface';
import {
  AlertStatus,
  SEVERITY_RANK,
} from '@/modules/alerts/domain/types/alert.types';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';
import { HistoryFeedQuery } from '@/modules/history/domain/interfaces/history-feed.interface';
import { DashboardLayout } from '@/modules/dashboard/domain/entities/dashboard-layout.entity';

export interface TestUser {
  id: string;
  username: string;
}

export const ADMIN: TestUser = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'jbidule',
};

export class FakeRedis {
  readonly store = new Map<string, string>();

  async safeGet(key: string) {
    return this.store.get(key) ?? null;
  }
  async safeSet(key: string, value: string) {
    this.store.set(key, value);
  }
  async safeSetEx(key: string, _ttl: number, value: string) {
    this.store.set(key, value);
  }
  async safeDel(key: string) {
    this.store.delete(key);
  }
  async safeExpire() {
    return;
  }
  async safeMGet(keys: string[]) {
    return keys.map((key) => this.store.get(key) ?? null);
  }
  async safeIncr(key: string) {
    const value = Number(this.store.get(key) ?? 0) + 1;
    this.store.set(key, String(value));
    return value;
  }
  async safeSetNxEx(key: string, _ttl: number, value: string) {
    if (this.store.has(key)) return false;
    this.store.set(key, value);
    return true;
  }
  async safeReleaseLock(key: string, value: string) {
    if (this.store.get(key) !== value) return false;
    this.store.delete(key);
    return true;
  }
  async keys(pattern: string) {
    const prefix = pattern.replace('*', '');
    return [...this.store.keys()].filter((key) => key.startsWith(prefix));
  }
  isOnline() {
    return true;
  }
}

export class InMemoryAlertRepository implements AlertRepositoryInterface {
  readonly alerts: Alert[] = [];

  constructor(
    private readonly transitions: InMemoryAlertTransitionRepository,
  ) {}

  async findOpenByDedupKey(dedupKey: string) {
    return (
      this.alerts.find(
        (alert) =>
          alert.dedupKey === dedupKey && alert.status === AlertStatus.OPEN,
      ) ?? null
    );
  }
  async findById(id: string) {
    return this.alerts.find((alert) => alert.id === id) ?? null;
  }
  async findByIdWithTransitions(id: string) {
    const alert = await this.findById(id);
    if (!alert) return null;
    alert.transitions = this.transitions.forAlert(id);
    return alert;
  }
  async save(alert: Alert) {
    if (!alert.id) {
      alert.id = randomUUID();
      this.alerts.push(alert);
    }
    return alert;
  }
  async paginate(filters: AlertListFilters): Promise<[Alert[], number]> {
    const matching = this.sorted().filter(
      (alert) =>
        (!filters.status || alert.status === filters.status) &&
        (!filters.severity || alert.severity === filters.severity) &&
        (!filters.resourceType || alert.resourceType === filters.resourceType),
    );
    const start = (filters.page - 1) * filters.limit;
    return [matching.slice(start, start + filters.limit), matching.length];
  }
  async findOpen(limit = 50) {
    return this.sorted()
      .filter((alert) => alert.status === AlertStatus.OPEN)
      .slice(0, limit);
  }
  async countOpen(): Promise<OpenAlertCounts> {
    const open = this.alerts.filter(
      (alert) => alert.status === AlertStatus.OPEN,
    );
    const count = (severity: string) =>
      open.filter((alert) => alert.severity === severity).length;
    return {
      critical: count('critical'),
      warning: count('warning'),
      info: count('info'),
      unacknowledgedCritical: open.filter(
        (alert) => alert.severity === 'critical' && !alert.acknowledgedAt,
      ).length,
    };
  }
  private sorted() {
    return [...this.alerts].sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        b.openedAt.getTime() - a.openedAt.getTime(),
    );
  }
}

export class InMemoryAlertTransitionRepository
  implements AlertTransitionRepositoryInterface
{
  readonly transitions: AlertTransition[] = [];
  alerts?: InMemoryAlertRepository;

  constructor(private readonly users: TestUser[]) {}

  async save(transition: AlertTransition) {
    transition.id = randomUUID();
    this.transitions.push(transition);
    return transition;
  }
  async findFeed(query: AlertTransitionFeedQuery) {
    return this.transitions
      .filter((transition) => !query.excludeTypes.includes(transition.type))
      .map((transition) => this.hydrate(transition))
      .sort((a, b) => b.at.getTime() - a.at.getTime() || (a.id < b.id ? 1 : -1))
      .slice(0, query.limit);
  }
  forAlert(alertId: string) {
    return this.transitions
      .filter((transition) => transition.alertId === alertId)
      .map((transition) => this.hydrate(transition));
  }
  private hydrate(transition: AlertTransition): AlertTransition {
    const user = this.users.find(
      (candidate) => candidate.id === transition.byUserId,
    );
    return Object.assign(new AlertTransition(), transition, {
      alert: this.alerts?.alerts.find(
        (alert) => alert.id === transition.alertId,
      ),
      byUser: user ?? null,
    });
  }
}

export class InMemoryHistoryRepository {
  readonly events: HistoryEvent[] = [];

  constructor(private readonly users: TestUser[]) {}

  async save(event: HistoryEvent) {
    event.id = randomUUID();
    event.createdAt = new Date();
    this.events.push(event);
    return event;
  }
  async findFeedEvents(query: HistoryFeedQuery) {
    return this.events
      .filter(
        (event) =>
          query.entities.includes(event.entity) &&
          query.actions.includes(event.action),
      )
      .map((event) =>
        Object.assign(new HistoryEvent(), event, {
          user: this.users.find((user) => user.id === event.userId),
        }),
      )
      .slice(0, query.limit);
  }
}

export class InMemoryLayoutRepository {
  readonly layouts: DashboardLayout[] = [];

  async findByUserId(userId: string) {
    return this.layouts.filter((layout) => layout.userId === userId);
  }
  async findById(id: string) {
    return this.layouts.find((layout) => layout.id === id) ?? null;
  }
  async findByIdAndUserId(id: string, userId: string) {
    return (
      this.layouts.find(
        (layout) => layout.id === id && layout.userId === userId,
      ) ?? null
    );
  }
  async findDefaultByUserId(userId: string) {
    return (
      this.layouts.find(
        (layout) => layout.userId === userId && layout.isDefault,
      ) ?? null
    );
  }
  async save(layout: DashboardLayout) {
    if (!layout.id) {
      layout.id = randomUUID();
      layout.createdAt = new Date();
      this.layouts.push(layout);
    }
    layout.updatedAt = new Date();
    (layout.widgets ?? []).forEach(
      (widget) => (widget.id = widget.id ?? randomUUID()),
    );
    return layout;
  }
  async delete(id: string) {
    const index = this.layouts.findIndex((layout) => layout.id === id);
    if (index >= 0) this.layouts.splice(index, 1);
  }
  async setDefaultLayout(layoutId: string, userId: string) {
    this.layouts
      .filter((layout) => layout.userId === userId)
      .forEach((layout) => (layout.isDefault = layout.id === layoutId));
  }
  async unsetAllDefaultLayouts(userId: string) {
    this.layouts
      .filter((layout) => layout.userId === userId)
      .forEach((layout) => (layout.isDefault = false));
  }
}

@Injectable()
export class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      userId: ADMIN.id,
      email: 'jbidule@upstra.local',
      isActive: true,
      isTwoFactorEnabled: false,
    };
    return true;
  }
}

export async function eventually<T>(
  read: () => Promise<T> | T,
  accept: (value: T) => boolean,
  timeoutMs = 2000,
): Promise<T> {
  const started = Date.now();
  for (;;) {
    const value = await read();
    if (accept(value)) return value;
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        `Condition not met within ${timeoutMs}ms, last value: ${JSON.stringify(value)}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
