import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import {
  UpsNotFoundException,
  UpsRetrievalException,
} from '../../domain/exceptions/ups.exception';

@Injectable()
export class GetUpsByIdUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UpsResponseDto> {
    try {
      const ups = await this.upsRepository.findUpsById(id);
      return new UpsResponseDto(ups);
    } catch (error) {
      if (error instanceof UpsNotFoundException) throw error;
      throw new UpsRetrievalException(error.message);
    }
  }
}
