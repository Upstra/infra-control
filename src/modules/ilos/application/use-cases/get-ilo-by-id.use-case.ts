import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from '../dto/ilo.response.dto';

@Injectable()
export class GetIloByIdUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<IloResponseDto> {
    const ilo = await this.iloRepository.findIloById(id);
    return new IloResponseDto(ilo);
  }
}
