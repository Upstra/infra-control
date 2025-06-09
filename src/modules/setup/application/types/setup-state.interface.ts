import { SetupPhase } from './setup-phase.enum';

export interface SetupState {
  phase: SetupPhase;
  hasAdminUser: boolean;
  hasInfrastructure: boolean;
  nextRequiredStep: string | null;
}
