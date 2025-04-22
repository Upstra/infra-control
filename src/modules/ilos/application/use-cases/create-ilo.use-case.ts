import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
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
    try {
      const entity = this.iloDomain.createIloEntityFromDto(iloDto);
      const ilo = await this.iloRepository.save(entity);
      return new IloResponseDto(ilo);
    } catch {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
