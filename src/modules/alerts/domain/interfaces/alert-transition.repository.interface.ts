import { AlertTransition } from '../entities/alert-transition.entity';
import { AlertTransitionType } from '../types/alert.types';

export interface AlertTransitionFeedQuery {
  excludeTypes: AlertTransitionType[];
  from?: Date;
  to?: Date;
  before?: { at: Date; id: string };
  limit: number;
}

export interface AlertTransitionRepositoryInterface {
  save(transition: AlertTransition): Promise<AlertTransition>;
  findFeed(query: AlertTransitionFeedQuery): Promise<AlertTransition[]>;
}
