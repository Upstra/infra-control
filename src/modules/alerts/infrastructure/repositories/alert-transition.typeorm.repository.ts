import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlertTransition } from '../../domain/entities/alert-transition.entity';
import {
  AlertTransitionFeedQuery,
  AlertTransitionRepositoryInterface,
} from '../../domain/interfaces/alert-transition.repository.interface';

@Injectable()
export class AlertTransitionTypeormRepository
  implements AlertTransitionRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<AlertTransition> {
    return this.dataSource.getRepository(AlertTransition);
  }

  save(transition: AlertTransition): Promise<AlertTransition> {
    return this.repository.save(transition);
  }

  findFeed(query: AlertTransitionFeedQuery): Promise<AlertTransition[]> {
    const qb = this.repository
      .createQueryBuilder('transition')
      .innerJoinAndSelect('transition.alert', 'alert')
      .leftJoinAndSelect('transition.byUser', 'byUser');

    if (query.excludeTypes.length > 0) {
      qb.andWhere('transition.type NOT IN (:...excludeTypes)', {
        excludeTypes: query.excludeTypes,
      });
    }
    if (query.from) {
      qb.andWhere('transition.at >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('transition.at <= :to', { to: query.to });
    }
    if (query.before) {
      qb.andWhere(
        '(transition.at < :beforeAt OR (transition.at = :beforeAt AND transition.id < :beforeId))',
        { beforeAt: query.before.at, beforeId: query.before.id },
      );
    }

    return qb
      .orderBy('transition.at', 'DESC')
      .addOrderBy('transition.id', 'DESC')
      .take(query.limit)
      .getMany();
  }
}
