import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AlertRepositoryInterface } from '../../domain/interfaces/alert.repository.interface';
import { AlertNotFoundException } from '../../domain/exceptions/alert.exceptions';
import { AlertService } from '../../domain/services/alert.service';
import { AlertPermissionService } from '../services/alert-permission.service';
import { AlertResponseDto } from '../dto/alert.response.dto';

@Injectable()
export class AcknowledgeAlertUseCase {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
    private readonly alertService: AlertService,
    private readonly permissionService: AlertPermissionService,
  ) {}

  async execute(
    alertId: string,
    userId: string,
    acknowledged: boolean,
  ): Promise<AlertResponseDto> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) throw new AlertNotFoundException(alertId);
    if (!(await this.permissionService.canAct(userId, alert))) {
      throw new ForbiddenException(
        `You are not allowed to act on this ${alert.resourceType}`,
      );
    }

    const updated = acknowledged
      ? await this.alertService.acknowledge(alertId, userId)
      : await this.alertService.unacknowledge(alertId, userId);
    return new AlertResponseDto(updated);
  }
}
