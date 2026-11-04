import { Inject, Injectable } from '@nestjs/common';
import { AlertRepositoryInterface } from '../../domain/interfaces/alert.repository.interface';
import { AlertListQueryDto } from '../dto/alert-list.query.dto';
import {
  AlertListResponseDto,
  AlertResponseDto,
} from '../dto/alert.response.dto';

@Injectable()
export class ListAlertsUseCase {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
  ) {}

  async execute(query: AlertListQueryDto): Promise<AlertListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [alerts, total] = await this.alertRepository.paginate({
      status: query.status,
      severity: query.severity,
      resourceType: query.resourceType,
      page,
      limit,
    });
    return new AlertListResponseDto(
      alerts.map((alert) => new AlertResponseDto(alert)),
      total,
      page,
      limit,
    );
  }
}
