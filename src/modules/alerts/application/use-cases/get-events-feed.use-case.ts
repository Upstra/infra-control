import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '@/modules/history/domain/interfaces/history.repository.interface';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';
import {
  FEED_HISTORY_ACTIONS,
  FEED_HISTORY_ENTITIES,
  HistoryAction,
} from '@/modules/history/domain/enums/history.enums';
import { AlertTransitionRepositoryInterface } from '../../domain/interfaces/alert-transition.repository.interface';
import { AlertTransition } from '../../domain/entities/alert-transition.entity';
import { AlertTransitionType } from '../../domain/types/alert.types';
import {
  EventsFeedQueryDto,
  EventsFeedResponseDto,
  FeedItemDto,
} from '../dto/events-feed.dto';

interface FeedCursor {
  at: Date;
  id: string;
}

const ACTION_VERBS: Record<string, string> = {
  [HistoryAction.START]: 'a démarré',
  [HistoryAction.RESTART]: 'a redémarré',
  [HistoryAction.SHUTDOWN]: 'a arrêté',
  [HistoryAction.POWER_CONTROL]: "a piloté l'alimentation de",
  [HistoryAction.UPDATE]: 'a modifié',
};

@Injectable()
export class GetEventsFeedUseCase {
  constructor(
    @Inject('AlertTransitionRepositoryInterface')
    private readonly transitionRepository: AlertTransitionRepositoryInterface,
    @Inject('HistoryRepositoryInterface')
    private readonly historyRepository: HistoryRepositoryInterface,
  ) {}

  async execute(query: EventsFeedQueryDto): Promise<EventsFeedResponseDto> {
    const limit = query.limit ?? 30;
    const before = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const [transitions, history] = await Promise.all([
      this.transitionRepository.findFeed({
        excludeTypes: [AlertTransitionType.DEESCALATED],
        from,
        to,
        before,
        limit,
      }),
      this.historyRepository.findFeedEvents({
        entities: FEED_HISTORY_ENTITIES,
        actions: FEED_HISTORY_ACTIONS,
        from,
        to,
        before,
        limit,
      }),
    ]);

    const items = [
      ...transitions.map((transition) => this.fromTransition(transition)),
      ...history.map((event) => this.fromHistory(event)),
    ]
      .sort((a, b) => this.compare(a, b))
      .slice(0, limit);

    const last = items[items.length - 1];
    return {
      items,
      nextCursor:
        items.length === limit && last
          ? this.encodeCursor({ at: last.at, id: last.id })
          : null,
    };
  }

  private fromTransition(transition: AlertTransition): FeedItemDto {
    const alert = transition.alert!;
    const actor = transition.byUser
      ? { id: transition.byUser.id, username: transition.byUser.username }
      : null;
    return {
      id: transition.id,
      kind: 'alert',
      tone: alert.severity,
      event: transition.type,
      title: this.transitionTitle(transition, actor?.username ?? null),
      resource: {
        type: alert.resourceType,
        id: alert.resourceId,
        name: alert.resourceName,
      },
      at: transition.at,
      by: actor,
      alertId: alert.id,
    };
  }

  private transitionTitle(
    transition: AlertTransition,
    username: string | null,
  ): string {
    const alert = transition.alert!;
    switch (transition.type) {
      case AlertTransitionType.ESCALATED:
        return `${alert.title} — aggravée (${transition.toSeverity})`;
      case AlertTransitionType.ACKNOWLEDGED:
        return `${username ?? 'Un utilisateur'} a acquitté ${alert.resourceName}`;
      case AlertTransitionType.UNACKNOWLEDGED:
        return username
          ? `${username} a retiré l'acquittement de ${alert.resourceName}`
          : `Acquittement retiré, alerte aggravée : ${alert.title}`;
      case AlertTransitionType.RESOLVED:
        return `Résolue : ${alert.title}`;
      default:
        return alert.title;
    }
  }

  private fromHistory(event: HistoryEvent): FeedItemDto {
    const username = event.user?.username ?? null;
    const name = this.historyResourceName(event);
    const verb = ACTION_VERBS[event.action] ?? event.action.toLowerCase();
    return {
      id: event.id,
      kind: 'action',
      tone: 'info',
      event: event.action,
      title: `${username ?? 'Système'} ${verb} ${name ?? event.entity}`,
      resource: { type: event.entity, id: event.entityId, name },
      at: event.createdAt,
      by: event.userId ? { id: event.userId, username } : null,
      alertId: null,
    };
  }

  private historyResourceName(event: HistoryEvent): string | null {
    const candidates = [
      event.newValue?.name,
      event.oldValue?.name,
      event.metadata?.name,
      event.metadata?.serverName,
      event.metadata?.vmName,
    ];
    const name = candidates.find((value) => typeof value === 'string');
    return (name as string | undefined) ?? null;
  }

  private compare(a: FeedItemDto, b: FeedItemDto): number {
    const diff = new Date(b.at).getTime() - new Date(a.at).getTime();
    if (diff !== 0) return diff;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  }

  private encodeCursor(cursor: FeedCursor): string {
    return Buffer.from(
      `${new Date(cursor.at).toISOString()}|${cursor.id}`,
    ).toString('base64url');
  }

  private decodeCursor(value: string): FeedCursor {
    const [at, id] = Buffer.from(value, 'base64url')
      .toString('utf8')
      .split('|');
    const date = new Date(at);
    if (!id || Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid cursor');
    }
    return { at: date, id };
  }
}
