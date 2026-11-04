import { Inject, Injectable } from '@nestjs/common';
import { AlertRepositoryInterface } from '../../domain/interfaces/alert.repository.interface';
import { Alert } from '../../domain/entities/alert.entity';

@Injectable()
export class ListOpenAlertsUseCase {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
  ) {}

  execute(limit = 50): Promise<Alert[]> {
    return this.alertRepository.findOpen(limit);
  }
}
