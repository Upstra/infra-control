import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { UpsRetrievalException } from '../../domain/exceptions/ups.exception';

@Injectable()
export class GetAllUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(): Promise<UpsResponseDto[]> {
    try {
      const ups = await this.upsRepository.findAll();
      return ups.map((u) => new UpsResponseDto(u));
    } catch (error) {
      throw new UpsRetrievalException(error.message);
    }
  }
}
