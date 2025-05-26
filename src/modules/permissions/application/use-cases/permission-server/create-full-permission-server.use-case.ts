import { Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';

@Injectable()
export class CreateFullPermissionServerUseCase {
  constructor(
    private readonly repository: PermissionServerRepository,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(): Promise<PermissionServerDto> {
    const entity = this.domainService.createFullPermissionEntity();
    const saved = await this.repository.save(entity);
    return PermissionServerDto.fromEntity(saved);
  }
}
