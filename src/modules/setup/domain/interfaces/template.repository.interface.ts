import { RepositoryInterface } from '@/core/domain/interfaces/repository.interface';
import { Template } from '../entities/template.entity';

export interface TemplateRepositoryInterface
  extends RepositoryInterface<Template> {
  findByType(type: string): Promise<Template[]>;
  findByCreatedBy(createdBy: string): Promise<Template[]>;
}