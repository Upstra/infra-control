import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloUpdateDto } from '../dto/ilo.update.dto';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';
@Injectable()
export class UpdateIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async execute(id: string, iloDto: IloUpdateDto): Promise<IloResponseDto> {
    const iloExists = await this.iloRepository.findIloById(id);
    const entity = this.iloDomain.updateIloEntityFromDto(iloExists, iloDto);
    const updated = await this.iloRepository.save(entity);
    return new IloResponseDto(updated);
  }
}
