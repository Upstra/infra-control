import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloCreationDto } from '../dto/ilo.creation.dto';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';
import { IloUpdateDto } from '../dto/ilo.update.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';

@Injectable()
export class IloService {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async getIloById(id: string): Promise<IloResponseDto> {
    try {
      const ilo = await this.iloRepository.findIloById(id);
      return new IloResponseDto(ilo);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createIlo(iloDto: IloCreationDto): Promise<IloResponseDto> {
    try {
      const iloEntity = this.iloDomain.createIloEntityFromDto(iloDto);
      const ilo = await this.iloRepository.save(iloEntity);
      return new IloResponseDto(ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateIlo(id: string, iloDto: IloUpdateDto): Promise<IloResponseDto> {
    try {
      const ilo = await this.iloRepository.updateIlo(
        id,
        iloDto.name,
        iloDto.ip,
        iloDto.login,
        iloDto.password,
      );
      return new IloResponseDto(ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteIlo(id: string): Promise<void> {
    try {
      await this.iloRepository.deleteIlo(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof IloNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
