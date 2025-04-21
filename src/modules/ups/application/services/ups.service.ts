import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsCreationDto } from '../dto/ups.creation.dto';
import { UpsEndpointInterface } from '../interfaces/ups.endpoint.interface';
import { UpsUpdateDto } from '../dto/ups.update.dto';

@Injectable()
export class UpsService implements UpsEndpointInterface {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async getAllUps(): Promise<UpsResponseDto[]> {
    const ups = await this.upsRepository.findAll();
    return ups.map((up) => new UpsResponseDto(up));
  }

  async getUpsById(id: string): Promise<UpsResponseDto> {
    const ups = await this.upsRepository.findUpsById(id);
    return new UpsResponseDto(ups);
  }

  async createUps(upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    const ups = await this.upsRepository.createUps(
      upsDto.name,
      upsDto.ip,
      upsDto.login,
      upsDto.password,
      upsDto.grace_period_on,
      upsDto.grace_period_off,
      upsDto.roomId,
    );
    return new UpsResponseDto(ups);
  }

  async updateUps(id: string, upsDto: UpsUpdateDto): Promise<UpsResponseDto> {
    const ups = await this.upsRepository.updateUps(id, upsDto);
    return new UpsResponseDto(ups);
  }

  async deleteUps(id: string): Promise<void> {
    await this.upsRepository.deleteUps(id);
  }
}
