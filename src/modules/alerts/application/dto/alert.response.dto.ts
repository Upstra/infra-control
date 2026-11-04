import { ApiProperty } from '@nestjs/swagger';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertTransition } from '../../domain/entities/alert-transition.entity';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
  AlertTransitionType,
} from '../../domain/types/alert.types';

export class AlertTransitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AlertTransitionType })
  type: AlertTransitionType;

  @ApiProperty()
  at: Date;

  @ApiProperty({ type: String, nullable: true })
  byUserId: string | null;

  @ApiProperty({ type: String, nullable: true })
  byUsername: string | null;

  @ApiProperty({ enum: AlertSeverity, nullable: true })
  fromSeverity: AlertSeverity | null;

  @ApiProperty({ enum: AlertSeverity, nullable: true })
  toSeverity: AlertSeverity | null;

  constructor(transition: AlertTransition) {
    this.id = transition.id;
    this.type = transition.type;
    this.at = transition.at;
    this.byUserId = transition.byUserId;
    this.byUsername = transition.byUser?.username ?? null;
    this.fromSeverity = transition.fromSeverity;
    this.toSeverity = transition.toSeverity;
  }
}

export class AlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dedupKey: string;

  @ApiProperty({ example: 'ups_on_battery' })
  type: string;

  @ApiProperty({ enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiProperty({ enum: AlertStatus })
  status: AlertStatus;

  @ApiProperty({ enum: AlertResourceType })
  resourceType: AlertResourceType;

  @ApiProperty()
  resourceId: string;

  @ApiProperty()
  resourceName: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: Object, nullable: true })
  details: Record<string, unknown> | null;

  @ApiProperty()
  openedAt: Date;

  @ApiProperty()
  lastSeenAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  resolvedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  acknowledgedAt: Date | null;

  @ApiProperty({ type: String, nullable: true })
  acknowledgedById: string | null;

  @ApiProperty()
  acknowledged: boolean;

  @ApiProperty()
  occurrences: number;

  @ApiProperty({ type: [AlertTransitionResponseDto], required: false })
  transitions?: AlertTransitionResponseDto[];

  constructor(alert: Alert, withTransitions = false) {
    this.id = alert.id;
    this.dedupKey = alert.dedupKey;
    this.type = alert.type;
    this.severity = alert.severity;
    this.status = alert.status;
    this.resourceType = alert.resourceType;
    this.resourceId = alert.resourceId;
    this.resourceName = alert.resourceName;
    this.title = alert.title;
    this.message = alert.message;
    this.details = alert.details;
    this.openedAt = alert.openedAt;
    this.lastSeenAt = alert.lastSeenAt;
    this.resolvedAt = alert.resolvedAt;
    this.acknowledgedAt = alert.acknowledgedAt;
    this.acknowledgedById = alert.acknowledgedById;
    this.acknowledged = alert.acknowledgedAt !== null;
    this.occurrences = alert.occurrences;
    if (withTransitions) {
      this.transitions = (alert.transitions ?? []).map(
        (transition) => new AlertTransitionResponseDto(transition),
      );
    }
  }
}

export class AlertListResponseDto {
  @ApiProperty({ type: [AlertResponseDto] })
  items: AlertResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  pageSize: number;

  constructor(
    items: AlertResponseDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.items = items;
    this.totalItems = total;
    this.currentPage = page;
    this.pageSize = limit;
    this.totalPages = Math.max(1, Math.ceil(total / limit));
  }
}

export class AlertSeverityCountsDto {
  @ApiProperty()
  critical: number;

  @ApiProperty()
  warning: number;

  @ApiProperty()
  info: number;
}

export class AlertSummaryResponseDto {
  @ApiProperty({ type: AlertSeverityCountsDto })
  open: AlertSeverityCountsDto;

  @ApiProperty()
  unacknowledgedCritical: number;
}
