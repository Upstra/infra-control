import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { GetUpsBatteryUseCase } from './get-ups-battery.use-case';
import { UpsTypeormRepository } from '../../infrastructure/repositories/ups.typeorm.repository';

@Injectable()
export class CheckAllUpsBatteriesUseCase {
  constructor(
    @Inject(UpsTypeormRepository)
    private upsRepository: UpsTypeormRepository,
    private getUpsBatteryUseCase: GetUpsBatteryUseCase,
  ) {}

  @Cron('*/1 * * * *')
  async execute(): Promise<void> {
    const upsList = await this.upsRepository.findAll();

    for (const ups of upsList) {
      try {
        await this.getUpsBatteryUseCase.execute(ups.id);
      } catch (error) {
        console.error(`Failed to check UPS ${ups.name} (${ups.ip}):`, error);
      }
    }
  }
}
