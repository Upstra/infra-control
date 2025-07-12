import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../../domain/entities/template.entity';
import { TemplateRepositoryInterface } from '../../domain/interfaces/template.repository.interface';
import { BaseTypeOrmRepository } from '@/core/infrastructure/repositories/base-typeorm.repository';

@Injectable()
export class TemplateRepository
  extends BaseTypeOrmRepository<Template>
  implements TemplateRepositoryInterface
{
  constructor(
    @InjectRepository(Template)
    templateRepository: Repository<Template>,
  ) {
    super(templateRepository);
  }

  async findByType(type: string): Promise<Template[]> {
    return this.repository.find({
      where: { type: type as any },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCreatedBy(createdBy: string): Promise<Template[]> {
    return this.repository.find({
      where: { createdBy },
      order: { createdAt: 'DESC' },
    });
  }
}