import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../../../ups/domain/interfaces/ups.repository.interface';
import { UpsStatusResponseDto } from '../../dto/widget-data.dto';

@Injectable()
export class GetUpsStatusUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(): Promise<UpsStatusResponseDto> {
    const upsList = await this.upsRepository.findAll();

    const upsStatuses = upsList.map((ups) => ({
      id: ups.id,
      name: ups.name,
      status: 'online' as const,
      batteryLevel: 95,
      load: 45,
      runtime: 120,
      temperature: 25,
      lastTest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextTest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }));

    const summary = {
      total: upsStatuses.length,
      online: upsStatuses.filter((u) => u.status === 'online').length,
      onBattery: 0, // TODO: Implement actual UPS status tracking
      offline: 0,
      averageLoad:
        upsStatuses.length > 0
          ? upsStatuses.reduce((sum, u) => sum + u.load, 0) / upsStatuses.length
          : 0,
    };

    return {
      ups: upsStatuses,
      summary,
    };
  }
}
