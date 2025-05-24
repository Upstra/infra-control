import { GroupServerUseCases } from './group-server';
import { GroupVmUseCases } from './group-vm';

export const GroupUseCases = [...GroupServerUseCases, ...GroupVmUseCases];
