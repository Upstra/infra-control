import { Injectable } from '@nestjs/common';
import { IloCreationDto } from '../../application/dto/ilo.creation.dto';
import { Ilo } from '../entities/ilo.entity';

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
}
