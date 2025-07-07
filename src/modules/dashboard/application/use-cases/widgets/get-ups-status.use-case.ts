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

    const upsStatuses = (upsList ?? []).map((ups) => ({
      id: ups.id,
      name: ups.name,
      status: 'unavailable' as const,
      batteryLevel: null,
      load: null,
      runtime: null,
      temperature: null,
      lastTest: null,
      nextTest: null,
      isMocked: true,
    }));

    const summary = {
      total: upsStatuses.length,
      online: 0,
      onBattery: 0,
      offline: 0,
      unavailable: upsStatuses.length,
      averageLoad: null,
      isMocked: true,
    };

    return {
      ups: upsStatuses,
      summary,
    };
  }
}
