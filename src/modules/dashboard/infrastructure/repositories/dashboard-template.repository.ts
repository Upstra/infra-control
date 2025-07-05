import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardTemplate } from '../../domain/entities/dashboard-template.entity';
import { IDashboardTemplateRepository } from '../../domain/interfaces/dashboard-template.repository.interface';

@Injectable()
export class DashboardTemplateRepository
  implements IDashboardTemplateRepository
{
  constructor(
    @InjectRepository(DashboardTemplate)
    private readonly repository: Repository<DashboardTemplate>,
  ) {}

  async findAll(): Promise<DashboardTemplate[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<DashboardTemplate | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async save(template: DashboardTemplate): Promise<DashboardTemplate> {
    return this.repository.save(template);
  }
}
