import { Injectable } from '@nestjs/common';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloCredentialsDto } from '../dto/ilo-power-action.dto';
import { IloStatusResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class GetServerStatusUseCase {
  constructor(private readonly iloPowerService: IloPowerService) {}

  async execute(ip: string, credentials: IloCredentialsDto): Promise<IloStatusResponseDto> {
    const status = await this.iloPowerService.getServerStatus(ip, credentials);

    return {
      status,
      ip,
    };
  }
}