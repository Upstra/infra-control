import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SetupProgress } from '../../domain/entities/setup-progress.entity';
import { SetupStep } from '../../application/dto/setup-status.dto';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';
import { FindOneByFieldOptions } from '@/core/utils';

@Injectable()
export class SetupProgressRepository
  extends Repository<SetupProgress>
  implements SetupProgressRepositoryInterface
{
  constructor(
    @InjectRepository(SetupProgress)
    private readonly setupProgressRepository: Repository<SetupProgress>,
  ) {
    super(
      setupProgressRepository.target,
      setupProgressRepository.manager,
      setupProgressRepository.queryRunner,
    );
  }

  /**
   * Retrieve all setup progress records sorted by completion date.
   */
  findAll(relations?: string[]): Promise<SetupProgress[]> {
    return this.setupProgressRepository.find({
      relations: relations || [],
      order: { completedAt: 'ASC' },
    });
  }
  /**
   * Find a single setup progress record by a given field.
   */
  async findOneByField<K extends keyof SetupProgress>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<SetupProgress, K>): Promise<SetupProgress | null> {
    if (value === undefined || value === null) {
      throw new Error(`Invalid value for ${String(field)}`);
    }
    try {
      return await this.findOneOrFail({
        where: { [field]: value } as any,
        relations,
      });
    } catch {
      if (disableThrow) return null;
      throw new NotFoundException();
    }
  }

  /**
   * Retrieve the progress record for a specific setup step.
   */
  async findByStep(step: SetupStep): Promise<SetupProgress | null> {
    return this.setupProgressRepository.findOne({
      where: { step },
    });
  }

  /**
   * Check whether a given setup step has already been completed.
   */
  async hasCompletedStep(step: SetupStep): Promise<boolean> {
    const count = await this.setupProgressRepository.count({
      where: { step },
    });
    return count > 0;
  }

  /**
   * Get all completed setup steps ordered chronologically.
   */
  async findAllCompletedSteps(): Promise<SetupProgress[]> {
    return this.setupProgressRepository.find({
      order: { completedAt: 'ASC' },
    });
  }
}
