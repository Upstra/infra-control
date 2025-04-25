import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsCreationDto } from '../../application/dto/ups.creation.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { UpsCreationException } from '../../domain/exceptions/ups.exception';

@Injectable()
export class CreateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(dto: UpsCreationDto): Promise<UpsResponseDto> {
    try {
      const ups = await this.upsRepository.createUps(
        dto.name,
        dto.ip,
        dto.login,
        dto.password,
        dto.grace_period_on,
        dto.grace_period_off,
        dto.roomId,
      );
      return new UpsResponseDto(ups);
    } catch (error) {
      throw new UpsCreationException(error.message);
    }
  }
}
