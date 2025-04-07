import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsCreationDto } from '../dto/ups.creation.dto';
import { UpsUpdateDto } from '../dto/ups.update.dto';

export interface UpsEndpointInterface {
  getAllUps(): Promise<UpsResponseDto[]>;
  getUpsById(id: string): Promise<UpsResponseDto>;
  createUps(upsDto: UpsCreationDto): Promise<UpsResponseDto>;
  updateUps(id: string, upsDto: UpsUpdateDto): Promise<UpsResponseDto>;
  deleteUps(id: string): Promise<void>;
}
