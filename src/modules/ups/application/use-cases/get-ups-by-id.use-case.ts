import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';

@Injectable()
export class GetUpsByIdUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UpsResponseDto> {
    const ups = await this.upsRepository.findUpsById(id);
    return new UpsResponseDto(ups);
  }
}
