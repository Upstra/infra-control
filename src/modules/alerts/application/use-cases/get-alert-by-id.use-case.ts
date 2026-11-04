import { Inject, Injectable } from '@nestjs/common';
import { AlertRepositoryInterface } from '../../domain/interfaces/alert.repository.interface';
import { AlertNotFoundException } from '../../domain/exceptions/alert.exceptions';
import { AlertResponseDto } from '../dto/alert.response.dto';

@Injectable()
export class GetAlertByIdUseCase {
  constructor(
    @Inject('AlertRepositoryInterface')
    private readonly alertRepository: AlertRepositoryInterface,
  ) {}

  async execute(id: string): Promise<AlertResponseDto> {
    const alert = await this.alertRepository.findByIdWithTransitions(id);
    if (!alert) throw new AlertNotFoundException(id);
    return new AlertResponseDto(alert, true);
  }
}
