import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloCreationDto } from '../dto/ilo.creation.dto';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';
@Injectable()
export class CreateIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async execute(iloDto: IloCreationDto): Promise<IloResponseDto> {
    const entity = this.iloDomain.createIloEntityFromDto(iloDto);
    const ilo = await this.iloRepository.save(entity);
    return new IloResponseDto(ilo);
  }
}
