import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';

@Injectable()
export class GetIloByIdUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<IloResponseDto> {
    try {
      const ilo = await this.iloRepository.findIloById(id);
      return new IloResponseDto(ilo);
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
