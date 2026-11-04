import { Inject, Injectable } from '@nestjs/common';
import { AlertRepositoryInterface } from '../../domain/interfaces/alert.repository.interface';
import { AlertSummaryResponseDto } from '../dto/alert.response.dto';

@Injectable()
export class GetAlertSummaryUseCase {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
  ) {}

  async execute(): Promise<AlertSummaryResponseDto> {
    const counts = await this.alertRepository.countOpen();
    return {
      open: {
        critical: counts.critical,
        warning: counts.warning,
        info: counts.info,
      },
      unacknowledgedCritical: counts.unacknowledgedCritical,
    };
  }
}
