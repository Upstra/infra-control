import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';

@Injectable()
export class DeleteIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      await this.iloRepository.deleteIlo(id);
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
