import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from './dto/ups.response.dto';
import { UpsCreationDto } from './dto/ups.creation.dto';

@Injectable()
export class UpsService {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async getAllUps(): Promise<UpsResponseDto> {
    return null;
  }

  async getUpsById(id: string): Promise<UpsResponseDto> {
    return null;
  }

  async createUps(upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    return null;
  }

  async updateUps(id: string, upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    return null;
  }

  async deleteUps(id: string): Promise<void> {
    return null;
  }
}
