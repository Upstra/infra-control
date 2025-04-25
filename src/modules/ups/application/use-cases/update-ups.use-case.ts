import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsUpdateDto } from '../../application/dto/ups.update.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import {
  UpsNotFoundException,
  UpsUpdateException,
} from '../../domain/exceptions/ups.exception';

@Injectable()
export class UpdateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string, dto: UpsUpdateDto): Promise<UpsResponseDto> {
    try {
      const ups = await this.upsRepository.updateUps(id, dto);
      return new UpsResponseDto(ups);
    } catch (error) {
      if (error instanceof UpsNotFoundException) throw error;
      throw new UpsUpdateException(error.message);
    }
  }
}
