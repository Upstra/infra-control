import { Injectable } from '@nestjs/common';
import { IloCreationDto } from '../../application/dto/ilo.creation.dto';
import { Ilo } from '../entities/ilo.entity';
import { IloUpdateDto } from '../../application/dto/ilo.update.dto';

@Injectable()
export class IloDomainService {
  createIloEntityFromDto(dto: IloCreationDto): Ilo {
    const ilo = new Ilo();
    ilo.name = dto.name;
    ilo.ip = dto.ip;
    ilo.login = dto.login;
    ilo.password = dto.password;
    return ilo;
  }

  updateIloEntityFromDto(ilo: Ilo, dto: IloUpdateDto): Ilo {
    ilo.name = dto.name ?? ilo.name;
    ilo.ip = dto.ip ?? ilo.ip;
    ilo.login = dto.login ?? ilo.login;
    ilo.password = dto.password ?? ilo.password;
    return ilo;
  }
}
