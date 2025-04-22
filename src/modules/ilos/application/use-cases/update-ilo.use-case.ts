import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloUpdateDto } from '../dto/ilo.update.dto';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';

@Injectable()
export class UpdateIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async execute(id: string, iloDto: IloUpdateDto): Promise<IloResponseDto> {
    try {
      const iloExists = await this.iloRepository.findIloById(id);
      const entity = this.iloDomain.updateIloEntityFromDto(iloExists, iloDto);
      const updated = await this.iloRepository.save(entity);
      return new IloResponseDto(updated);
    } catch (error) {
      if (error instanceof IloNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
