import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../../domain/entities/template.entity';
import { TemplateRepositoryInterface } from '../../domain/interfaces/template.repository.interface';
import { FindOneByFieldOptions } from '@/core/utils';

@Injectable()
export class TemplateRepository implements TemplateRepositoryInterface {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,
  ) {}

  async count(): Promise<number> {
    return this.repo.count();
  }

  async save(entity: Template): Promise<Template> {
    return this.repo.save(entity);
  }

  async findAll(relations?: string[]): Promise<Template[]> {
    return this.repo.find({ relations });
  }

  async findOneByField<K extends keyof Template>(
    options: FindOneByFieldOptions<Template, K>,
  ): Promise<Template | null> {
    return this.repo.findOne({
      where: { [options.field]: options.value } as any,
      relations: options.relations,
    });
  }

  async findByType(type: string): Promise<Template[]> {
    return this.repo.find({
      where: { type: type as any },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCreatedBy(createdBy: string): Promise<Template[]> {
    return this.repo.find({
      where: { createdBy },
      order: { createdAt: 'DESC' },
    });
  }
}
