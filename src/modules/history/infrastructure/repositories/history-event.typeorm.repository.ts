import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HistoryEvent } from '../../domain/entities/history-event.entity';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

@Injectable()
export class HistoryEventTypeormRepository
  extends Repository<HistoryEvent>
  implements HistoryRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(HistoryEvent, dataSource.createEntityManager());
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  private get repository(): Repository<HistoryEvent> {
    return this.dataSource.getRepository(HistoryEvent);
  }

  async save(entity: HistoryEvent): Promise<HistoryEvent> {
    return this.repository.save(entity);
  }

  async findAll(): Promise<HistoryEvent[]> {
    return this.repository.find();
  }

  async findOneByField<K extends keyof HistoryEvent>({
    field,
    value,
  }: {
    field: K;
    value: HistoryEvent[K];
  }): Promise<HistoryEvent | null> {
    return this.repository.findOne({ where: { [field]: value } as any });
  }

  async countCreatedByMonth(
    entity: string,
    months: number,
  ): Promise<Record<string, number>> {
    const qb = this.repository
      .createQueryBuilder('history')
      .select("to_char(history.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('history.entity = :entity', { entity })
      .andWhere('history.action = :action', { action: 'CREATE' })
      .andWhere(`history.createdAt >= NOW() - INTERVAL '${months} months'`)
      .groupBy('month')
      .orderBy('month', 'ASC');

    const results = await qb.getRawMany<{ month: string; count: string }>();
    return results.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.month] = Number(curr.count);
      return acc;
    }, {});
  }
}
