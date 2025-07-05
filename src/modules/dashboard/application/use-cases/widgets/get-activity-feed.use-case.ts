import { Injectable, Inject } from '@nestjs/common';
import { HistoryEventTypeormRepository } from '../../../../history/infrastructure/repositories/history-event.typeorm.repository';
import { HistoryEvent } from '../../../../history/domain/entities/history-event.entity';
import {
  ActivityFeedResponseDto,
  WidgetDataQueryDto,
} from '../../dto/widget-data.dto';

@Injectable()
export class GetActivityFeedUseCase {
  constructor(
    @Inject(HistoryEventTypeormRepository)
    private readonly historyRepository: HistoryEventTypeormRepository,
  ) {}

  async execute(query: WidgetDataQueryDto): Promise<ActivityFeedResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: any = {};

    if (query.dateFrom) {
      filter.createdAt = { $gte: new Date(query.dateFrom) };
    }

    if (query.dateTo) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(query.dateTo) };
    }

    // TODO: Implement proper history repository method
    const events = await this.historyRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
    const total = await this.historyRepository.count();

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
