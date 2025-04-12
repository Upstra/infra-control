import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsCreationDto } from '../dto/ups.creation.dto';
import { UpsEndpointInterface } from '../interfaces/ups.endpoint.interface';
import { UpsNotFoundException } from '../../domain/exceptions/ups.notfound.exception';
import { UpsUpdateDto } from '../dto/ups.update.dto';

@Injectable()
export class UpsService implements UpsEndpointInterface {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async getAllUps(): Promise<UpsResponseDto[]> {
    try {
      const ups = await this.upsRepository.findAll();
      return ups.map((up) => new UpsResponseDto(up));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getUpsById(id: string): Promise<UpsResponseDto> {
    try {
      const ups = await this.upsRepository.findUpsById(id);
      return new UpsResponseDto(ups);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createUps(upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    try {
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
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateUps(id: string, upsDto: UpsUpdateDto): Promise<UpsResponseDto> {
    try {
      const ups = await this.upsRepository.updateUps(id, upsDto);
      return new UpsResponseDto(ups);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteUps(id: string): Promise<void> {
    try {
      await this.upsRepository.deleteUps(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof UpsNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
