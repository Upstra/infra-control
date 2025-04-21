import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloCreationDto } from '../dto/ilo.creation.dto';
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
    const ilo = await this.iloRepository.findIloById(id);
    return new IloResponseDto(ilo);
  }

  async createIlo(iloDto: IloCreationDto): Promise<IloResponseDto> {
    const iloEntity = this.iloDomain.createIloEntityFromDto(iloDto);
    const ilo = await this.iloRepository.save(iloEntity);
    return new IloResponseDto(ilo);
  }

  async updateIlo(id: string, iloDto: IloUpdateDto): Promise<IloResponseDto> {
    const iloExists = await this.iloRepository.findIloById(id);
    const entity = this.iloDomain.updateIloEntityFromDto(iloExists, iloDto);
    const ilo = await this.iloRepository.save(entity);
    return new IloResponseDto(ilo);
  }

  async deleteIlo(id: string): Promise<void> {
    await this.iloRepository.deleteIlo(id);
  }
}
