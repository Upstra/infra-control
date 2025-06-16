import { SetupProgress } from '../entities/setup-progress.entity';
import { SetupStep } from '../../application/dto/setup-status.dto';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface SetupProgressRepositoryInterface
  extends GenericRepositoryInterface<SetupProgress> {
  /**
   * Trouve une progression par étape
   */
  findByStep(step: SetupStep): Promise<SetupProgress | null>;

  /**
   * Vérifie si une étape a été complétée
   */
  hasCompletedStep(step: SetupStep): Promise<boolean>;

  /**
   * Récupère toutes les étapes complétées
   */
  findAllCompletedSteps(): Promise<SetupProgress[]>;
}
