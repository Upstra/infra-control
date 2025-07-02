import { Injectable } from '@nestjs/common';
import { SafeRoleDeletionDomainService } from '../../domain/services/safe-role-deletion.domain.service';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    private readonly safeRoleDeletionService: SafeRoleDeletionDomainService,
  ) {}

  async execute(id: string): Promise<void> {
    await this.safeRoleDeletionService.safelyDeleteRole(id);
  }
}
