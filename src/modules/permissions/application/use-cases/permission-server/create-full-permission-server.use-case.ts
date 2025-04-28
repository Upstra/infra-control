import { Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServer } from '../../../domain/entities/permission.server.entity';

@Injectable()
export class CreateFullPermissionServerUseCase {
  constructor(
    private readonly repository: PermissionServerRepository,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(): Promise<PermissionServer> {
    const entity = this.domainService.createFullPermissionEntity();
    return await this.repository.save(entity);
  }
}
