import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryFailedError } from 'typeorm';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import {
  HistoryAction,
  HistoryEntity,
} from '@/modules/history/domain/enums/history.enums';
import { Alert } from '../entities/alert.entity';
import { AlertTransition } from '../entities/alert-transition.entity';
import { AlertEvents, AlertTransitionEvent } from '../events/alert.events';
import {
  AlertAlreadyResolvedException,
  AlertNotFoundException,
} from '../exceptions/alert.exceptions';
import { AlertRepositoryInterface } from '../interfaces/alert.repository.interface';
import { AlertTransitionRepositoryInterface } from '../interfaces/alert-transition.repository.interface';
import { RaiseAlertInput } from '../interfaces/raise-alert.interface';
import {
  AlertSeverity,
  AlertStatus,
  AlertTransitionType,
  SEVERITY_RANK,
} from '../types/alert.types';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class AlertService {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
    @Inject('AlertTransitionRepositoryInterface')
    private readonly transitionRepository: AlertTransitionRepositoryInterface,
    private readonly eventEmitter: EventEmitter2,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async raise(input: RaiseAlertInput): Promise<Alert> {
    const existing = await this.alertRepository.findOpenByDedupKey(
      input.dedupKey,
    );
    if (existing) {
      return this.confirm(existing, input);
    }

    try {
      return await this.open(input);
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      const concurrent = await this.alertRepository.findOpenByDedupKey(
        input.dedupKey,
      );
      if (!concurrent) throw error;
      return this.confirm(concurrent, input);
    }
  }

  async resolve(
    dedupKey: string,
    details?: Record<string, unknown> | null,
  ): Promise<Alert | null> {
    const alert = await this.alertRepository.findOpenByDedupKey(dedupKey);
    if (!alert) return null;

    const now = new Date();
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = now;
    if (details !== undefined) {
      alert.details = this.mergeDetails(alert.details, details);
    }
    const saved = await this.alertRepository.save(alert);
    await this.recordTransition(saved, AlertTransitionType.RESOLVED, now);
    return saved;
  }

  async acknowledge(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.findActionable(alertId);
    if (alert.acknowledgedAt) return alert;

    const now = new Date();
    alert.acknowledgedAt = now;
    alert.acknowledgedById = userId;
    const saved = await this.alertRepository.save(alert);
    await this.recordTransition(
      saved,
      AlertTransitionType.ACKNOWLEDGED,
      now,
      userId,
    );
    await this.logAcknowledgement(saved, HistoryAction.ACKNOWLEDGE, userId);
    return saved;
  }

  async unacknowledge(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.findActionable(alertId);
    if (!alert.acknowledgedAt) return alert;

    const now = new Date();
    alert.acknowledgedAt = null;
    alert.acknowledgedById = null;
    const saved = await this.alertRepository.save(alert);
    await this.recordTransition(
      saved,
      AlertTransitionType.UNACKNOWLEDGED,
      now,
      userId,
    );
    await this.logAcknowledgement(saved, HistoryAction.UNACKNOWLEDGE, userId);
    return saved;
  }

  private async open(input: RaiseAlertInput): Promise<Alert> {
    const now = new Date();
    const alert = new Alert();
    alert.dedupKey = input.dedupKey;
    alert.type = input.type;
    alert.severity = input.severity;
    alert.status = AlertStatus.OPEN;
    alert.resourceType = input.resource.type;
    alert.resourceId = input.resource.id;
    alert.resourceName = input.resource.name;
    alert.title = input.title;
    alert.message = input.message;
    alert.details = this.mergeDetails(null, input.details ?? null);
    alert.openedAt = now;
    alert.lastSeenAt = now;
    alert.resolvedAt = null;
    alert.acknowledgedAt = null;
    alert.acknowledgedById = null;
    alert.occurrences = 1;

    const saved = await this.alertRepository.save(alert);
    await this.recordTransition(saved, AlertTransitionType.OPENED, now, null, {
      to: saved.severity,
    });
    return saved;
  }

  private async confirm(alert: Alert, input: RaiseAlertInput): Promise<Alert> {
    const now = new Date();
    const previousSeverity = alert.severity;
    const escalated =
      SEVERITY_RANK[input.severity] > SEVERITY_RANK[previousSeverity];
    const deescalated =
      SEVERITY_RANK[input.severity] < SEVERITY_RANK[previousSeverity];
    const loseAcknowledgement = escalated && alert.acknowledgedAt !== null;

    alert.lastSeenAt = now;
    alert.occurrences += 1;
    alert.severity = input.severity;
    alert.title = input.title;
    alert.message = input.message;
    alert.resourceName = input.resource.name;
    if (input.details !== undefined) {
      alert.details = this.mergeDetails(alert.details, input.details);
    }
    if (loseAcknowledgement) {
      alert.acknowledgedAt = null;
      alert.acknowledgedById = null;
    }

    const saved = await this.alertRepository.save(alert);

    if (escalated || deescalated) {
      await this.recordTransition(
        saved,
        escalated
          ? AlertTransitionType.ESCALATED
          : AlertTransitionType.DEESCALATED,
        now,
        null,
        { from: previousSeverity, to: saved.severity },
      );
    }
    if (loseAcknowledgement) {
      await this.recordTransition(
        saved,
        AlertTransitionType.UNACKNOWLEDGED,
        now,
      );
    }
    return saved;
  }

  private async findActionable(alertId: string): Promise<Alert> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) throw new AlertNotFoundException(alertId);
    if (alert.status === AlertStatus.RESOLVED) {
      throw new AlertAlreadyResolvedException(alertId);
    }
    return alert;
  }

  private async recordTransition(
    alert: Alert,
    type: AlertTransitionType,
    at: Date,
    byUserId: string | null = null,
    severities: { from?: AlertSeverity; to?: AlertSeverity } = {},
  ): Promise<AlertTransition> {
    const transition = new AlertTransition();
    transition.alertId = alert.id;
    transition.type = type;
    transition.at = at;
    transition.byUserId = byUserId;
    transition.fromSeverity = severities.from ?? null;
    transition.toSeverity = severities.to ?? null;

    const saved = await this.transitionRepository.save(transition);
    const event: AlertTransitionEvent = { alert, transition: saved };
    this.eventEmitter.emit(AlertEvents.TRANSITION, event);
    return saved;
  }

  private mergeDetails(
    current: Record<string, unknown> | null,
    latest: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!current) {
      return latest ? { atOpen: latest, latest } : null;
    }
    return { ...current, latest };
  }

  private async logAcknowledgement(
    alert: Alert,
    action: HistoryAction,
    userId: string,
  ): Promise<void> {
    await this.logHistory.executeStructured({
      entity: HistoryEntity.ALERT,
      entityId: alert.id,
      action,
      userId,
      metadata: {
        title: alert.title,
        type: alert.type,
        severity: alert.severity,
        resourceType: alert.resourceType,
        resourceId: alert.resourceId,
        resourceName: alert.resourceName,
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === UNIQUE_VIOLATION;
  }
}
