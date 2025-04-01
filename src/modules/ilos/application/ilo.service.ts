import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from './dto/ilo.response.dto';
import { IloCreationDto } from './dto/ilo.creation.dto';

@Injectable()
export class IloService {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async getAllIlos(): Promise<IloResponseDto[]> {
    return null;
  }

  async getIloById(id: string): Promise<IloResponseDto> {
    return null;
  }

  async createIlo(iloDto: IloCreationDto): Promise<IloResponseDto> {
    return null;
  }

  async updateIlo(id: string, iloDto: IloCreationDto): Promise<IloResponseDto> {
    return null;
  }

  async deleteIlo(id: string): Promise<void> {
    return null;
  }
}
