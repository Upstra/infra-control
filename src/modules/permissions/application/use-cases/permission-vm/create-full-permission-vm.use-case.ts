import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVmDto } from '../../dto/permission.vm.dto';

@Injectable()
export class CreateFullPermissionVmUseCase {
  constructor(
    private readonly repository: PermissionVmRepository,
    private readonly domainService: PermissionDomainVmService,
  ) {}

  async execute(): Promise<PermissionVmDto> {
    const entity = this.domainService.createFullPermissionEntity();
    const saved = await this.repository.save(entity);
    return PermissionVmDto.fromEntity(saved);
  }
}
