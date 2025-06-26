import { UpsDomainService } from './../../domain/services/ups.domain.service';
import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsUpdateDto } from '../../application/dto/ups.update.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class UpdateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsDomainService: UpsDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string, dto: UpsUpdateDto): Promise<UpsResponseDto> {
    let ups = await this.upsRepository.findUpsById(id);

    ups = await this.upsDomainService.createUpsEntityFromUpdateDto(ups, dto);
    const saved = await this.upsRepository.save(ups);
    ups = Array.isArray(saved) ? saved[0] : saved;
    await this.logHistory?.execute('ups', ups.id, 'UPDATE');
    return new UpsResponseDto(ups);
  }
}
