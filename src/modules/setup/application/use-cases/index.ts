import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import { GetSetupStatusUseCase } from './get-setup-status.use-case';
import { CompleteVmDiscoveryUseCase } from './complete-vm-discovery.use-case';
import { GetSetupProgressUseCase } from './get-setup-progress.use-case';

export const SetupUseCases = [
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
];

export {
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
};
