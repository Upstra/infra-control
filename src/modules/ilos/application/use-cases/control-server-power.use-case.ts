import { Injectable } from '@nestjs/common';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloPowerActionDto } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class ControlServerPowerUseCase {
  constructor(private readonly iloPowerService: IloPowerService) {}

  async execute(
    ip: string,
    dto: IloPowerActionDto,
  ): Promise<IloPowerResponseDto> {
    const result = await this.iloPowerService.controlServerPower(
      ip,
      dto.action,
      dto.credentials,
    );

    return {
      success: result.success,
      message: result.message,
      currentStatus: result.currentStatus,
    };
  }
}
