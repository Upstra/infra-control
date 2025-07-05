import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardLayout } from '../../domain/entities/dashboard-layout.entity';
import { IDashboardLayoutRepository } from '../../domain/interfaces/dashboard-layout.repository.interface';

@Injectable()
export class DashboardLayoutRepository implements IDashboardLayoutRepository {
  constructor(
    @InjectRepository(DashboardLayout)
    private readonly repository: Repository<DashboardLayout>,
  ) {}

  async findByUserId(userId: string): Promise<DashboardLayout[]> {
    return this.repository.find({
      where: { userId },
      relations: ['widgets'],
      order: {
        isDefault: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<DashboardLayout | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['widgets'],
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<DashboardLayout | null> {
    return this.repository.findOne({
      where: { id, userId },
      relations: ['widgets'],
    });
  }

  async findDefaultByUserId(userId: string): Promise<DashboardLayout | null> {
    return this.repository.findOne({
      where: { userId, isDefault: true },
      relations: ['widgets'],
    });
  }

  async save(layout: DashboardLayout): Promise<DashboardLayout> {
    return this.repository.save(layout);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async setDefaultLayout(layoutId: string, userId: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.update(DashboardLayout, { userId }, { isDefault: false });

      await manager.update(
        DashboardLayout,
        { id: layoutId, userId },
        { isDefault: true },
      );
    });
  }

  async unsetAllDefaultLayouts(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isDefault: false });
  }
}
