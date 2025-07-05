import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

interface PrioritizedEntity {
  id: string;
  priority: number;
  name: string;
}
export abstract class SwapPrioritiesBaseUseCase<
  TEntity extends PrioritizedEntity,
  TPermission extends { bitmask: number },
  TResult,
> {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly logHistory: LogHistoryUseCase,
  ) {}

  protected abstract getEntityRepository(): Repository<TEntity>;
  protected abstract getEntityName(): string;
  protected abstract getEntityNamePlural(): string;
  protected abstract getUserPermissions(userId: string): Promise<TPermission[]>;
  protected abstract getPermissionId(permission: TPermission): string;
  protected abstract getLogMetadata(
    entity: TEntity,
    swapPartner: TEntity,
  ): Record<string, any>;
  protected abstract formatResult(entity1: TEntity, entity2: TEntity): TResult;

  async execute(
    entity1Id: string,
    entity2Id: string,
    userId: string,
  ): Promise<TResult> {
    const permissions = await this.getUserPermissions(userId);
    const permissionMap = new Map(
      permissions
        .filter((p) => this.getPermissionId(p) !== '')
        .map((p) => [this.getPermissionId(p), p.bitmask]),
    );

    const perm1 = permissionMap.get(entity1Id);
    const perm2 = permissionMap.get(entity2Id);

    const hasWritePermission = (bitmask: number | undefined) =>
      bitmask !== undefined &&
      (bitmask & PermissionBit.WRITE) === PermissionBit.WRITE;

    if (!hasWritePermission(perm1) || !hasWritePermission(perm2)) {
      throw new ForbiddenException(
        `You do not have write permissions on both ${this.getEntityNamePlural()}`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const entityRepo = manager.getRepository<TEntity>(
        this.getEntityRepository().target,
      );

      const entity1 = await entityRepo.findOne({
        where: { id: entity1Id } as FindOptionsWhere<TEntity>,
      });
      const entity2 = await entityRepo.findOne({
        where: { id: entity2Id } as FindOptionsWhere<TEntity>,
      });

      if (!entity1) {
        throw new NotFoundException(
          `${this.getEntityName()} with id "${entity1Id}" not found`,
        );
      }
      if (!entity2) {
        throw new NotFoundException(
          `${this.getEntityName()} with id "${entity2Id}" not found`,
        );
      }

      const entity1OriginalPriority = entity1.priority;
      const entity2OriginalPriority = entity2.priority;

      entity1.priority = entity2OriginalPriority;
      entity2.priority = entity1OriginalPriority;

      await entityRepo.save([entity1, entity2]);

      await this.logHistory.executeStructured({
        entity: this.getEntityName().toLowerCase(),
        entityId: entity1.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: entity1OriginalPriority },
        newValue: { priority: entity1.priority },
        metadata: {
          swapPartner: entity2.id,
          swapPartnerName: entity2.name,
          oldPriority: entity1OriginalPriority,
          newPriority: entity1.priority,
          ...this.getLogMetadata(entity1, entity2),
        },
      });

      await this.logHistory.executeStructured({
        entity: this.getEntityName().toLowerCase(),
        entityId: entity2.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: entity2OriginalPriority },
        newValue: { priority: entity2.priority },
        metadata: {
          swapPartner: entity1.id,
          swapPartnerName: entity1.name,
          oldPriority: entity2OriginalPriority,
          newPriority: entity2.priority,
          ...this.getLogMetadata(entity2, entity1),
        },
      });

      return this.formatResult(entity1, entity2);
    });
  }
}
