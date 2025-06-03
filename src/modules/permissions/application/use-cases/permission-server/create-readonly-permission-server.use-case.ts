import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServer } from '../../../domain/entities/permission.server.entity';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class CreateReadOnlyPermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(): Promise<PermissionServer> {
    const entity = this.domainService.createReadOnlyPermissionEntity();
    return await this.repository.save(entity);
  }
}
