import { Inject, Injectable, Logger } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { GetUpsBatteryUseCase } from './get-ups-battery.use-case';

export interface CheckAllUpsBatteriesResult {
  checked: number;
  failed: number;
  onBattery: number;
}

@Injectable()
export class CheckAllUpsBatteriesUseCase {
  private readonly logger = new Logger(CheckAllUpsBatteriesUseCase.name);

  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase,
  ) {}

  async execute(): Promise<CheckAllUpsBatteriesResult> {
    const upsList = await this.upsRepository.findAll();
    const result: CheckAllUpsBatteriesResult = {
      checked: 0,
      failed: 0,
      onBattery: 0,
    };

    for (const ups of upsList) {
      try {
        const status = await this.getUpsBatteryUseCase.execute(ups.id, {
          forceRefresh: true,
        });
        result.checked++;
        if (status.onBattery === true) result.onBattery++;
      } catch (error) {
        result.failed++;
        this.logger.warn(
          `Failed to check UPS ${ups.name} (${ups.ip}): ${error?.message}`,
        );
      }
    }

    return result;
  }
}
