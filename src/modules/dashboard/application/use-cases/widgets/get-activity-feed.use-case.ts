import { Injectable, Inject } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../../../history/domain/interfaces/history.repository.interface';
import { HistoryEvent } from '../../../../history/domain/entities/history-event.entity';
import {
  ActivityFeedResponseDto,
  WidgetDataQueryDto,
} from '../../dto/widget-data.dto';

@Injectable()
export class GetActivityFeedUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly historyRepository: HistoryRepositoryInterface,
  ) {}

  async execute(query: WidgetDataQueryDto): Promise<ActivityFeedResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: any = {};

    if (query.dateFrom) {
      filters.dateFrom = new Date(query.dateFrom);
    }

    if (query.dateTo) {
      filters.dateTo = new Date(query.dateTo);
    }

    const [events, total] = await this.historyRepository.paginate(
      page,
      limit,
      ['user'],
      filters,
    );

    const activities = events.map((event) => ({
      id: event.id,
      type: `${event.entity}_${event.action}`,
      actor: {
        id: event.userId || 'system',
        name: event.user?.email || 'System',
        avatar: undefined,
      },
      target: {
        type: event.entity,
        id: event.entityId,
        name: event.newValue?.name || event.entityId,
      },
      timestamp: event.createdAt,
      description: this.generateDescription(event),
    }));

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  private generateDescription(event: HistoryEvent): string {
    const actionMap: Record<string, string> = {
      created: 'créé',
      updated: 'mis à jour',
      deleted: 'supprimé',
    };

    const entityMap: Record<string, string> = {
      server: 'serveur',
      vm: 'VM',
      user: 'utilisateur',
      group: 'groupe',
      room: 'salle',
    };

    const action = actionMap[event.action] || event.action;
    const entity = entityMap[event.entity] || event.entity;

    return `${entity} ${action}`;
  }
}
