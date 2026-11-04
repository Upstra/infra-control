import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Alert } from '../../domain/entities/alert.entity';
import {
  AlertListFilters,
  AlertRepositoryInterface,
  OpenAlertCounts,
} from '../../domain/interfaces/alert.repository.interface';
import { AlertSeverity, AlertStatus } from '../../domain/types/alert.types';

const SEVERITY_ORDER = `CASE alert.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END`;

@Injectable()
export class AlertTypeormRepository implements AlertRepositoryInterface {
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<Alert> {
    return this.dataSource.getRepository(Alert);
  }

  findOpenByDedupKey(dedupKey: string): Promise<Alert | null> {
    return this.repository.findOne({
      where: { dedupKey, status: AlertStatus.OPEN },
    });
  }

  findById(id: string): Promise<Alert | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdWithTransitions(id: string): Promise<Alert | null> {
    return this.repository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.transitions', 'transition')
      .leftJoinAndSelect('transition.byUser', 'byUser')
      .leftJoinAndSelect('alert.acknowledgedBy', 'acknowledgedBy')
      .where('alert.id = :id', { id })
      .orderBy('transition.at', 'ASC')
      .getOne();
  }

  save(alert: Alert): Promise<Alert> {
    return this.repository.save(alert);
  }

  paginate(filters: AlertListFilters): Promise<[Alert[], number]> {
    const qb = this.repository.createQueryBuilder('alert');

    if (filters.status) {
      qb.andWhere('alert.status = :status', { status: filters.status });
    }
    if (filters.severity) {
      qb.andWhere('alert.severity = :severity', { severity: filters.severity });
    }
    if (filters.resourceType) {
      qb.andWhere('alert.resourceType = :resourceType', {
        resourceType: filters.resourceType,
      });
    }

    return qb
      .addSelect(SEVERITY_ORDER, 'severity_rank')
      .orderBy('severity_rank', 'ASC')
      .addOrderBy('alert.openedAt', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();
  }

  findOpen(limit = 50): Promise<Alert[]> {
    return this.repository
      .createQueryBuilder('alert')
      .where('alert.status = :status', { status: AlertStatus.OPEN })
      .addSelect(SEVERITY_ORDER, 'severity_rank')
      .orderBy('severity_rank', 'ASC')
      .addOrderBy('alert.openedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async countOpen(): Promise<OpenAlertCounts> {
    const rows: Array<{
      severity: AlertSeverity;
      total: string;
      unack: string;
    }> = await this.repository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'COUNT(*) FILTER (WHERE alert.acknowledgedAt IS NULL)',
        'unack',
      )
      .where('alert.status = :status', { status: AlertStatus.OPEN })
      .groupBy('alert.severity')
      .getRawMany();

    const counts: OpenAlertCounts = {
      critical: 0,
      warning: 0,
      info: 0,
      unacknowledgedCritical: 0,
    };
    rows.forEach((row) => {
      counts[row.severity] = Number(row.total);
      if (row.severity === AlertSeverity.CRITICAL) {
        counts.unacknowledgedCritical = Number(row.unack);
      }
    });
    return counts;
  }
}
