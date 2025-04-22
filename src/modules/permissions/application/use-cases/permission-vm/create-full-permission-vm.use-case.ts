import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVm } from '../../../domain/entities/permission.vm.entity';

@Injectable()
export class CreateFullPermissionVmUseCase {
  constructor(
    private readonly repository: PermissionVmRepository,
    private readonly domainService: PermissionDomainVmService,
  ) {}

  async execute(): Promise<PermissionVm> {
    try {
      const entity = this.domainService.createFullPermissionEntity();
      return await this.repository.save(entity);
    } catch (error) {
      throw new Error(
        'Erreur lors de la création de la permission VM full access',
      );
    }
  }
}
