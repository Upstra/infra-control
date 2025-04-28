import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsCreationDto } from '../../application/dto/ups.creation.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { UpsDomainService } from '../../domain/services/ups.domain.service';

@Injectable()
export class CreateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsDomainService: UpsDomainService,
  ) {}

  async execute(dto: UpsCreationDto): Promise<UpsResponseDto> {
    const entity =
      await this.upsDomainService.createUpsEntityFromCreateDto(dto);
    const saved = await this.upsRepository.save(entity);

    const ups = Array.isArray(saved) ? saved[0] : saved;

    return new UpsResponseDto(ups);
  }
}
