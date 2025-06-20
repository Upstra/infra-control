import { BadRequestException } from '@nestjs/common';
import { CompleteVmDiscoveryUseCase } from '../complete-vm-discovery.use-case';
import { SetupStep } from '../../dto/setup-status.dto';

const repo = {
  findOneByField: jest.fn(),
};
const progressRepo = {
  hasCompletedStep: jest.fn(),
};
const completeStep = { execute: jest.fn() } as any;

describe('CompleteVmDiscoveryUseCase', () => {
  let useCase: CompleteVmDiscoveryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CompleteVmDiscoveryUseCase(progressRepo as any, repo as any, completeStep);
  });

  it('completes vm discovery when server exists and step done', async () => {
    repo.findOneByField.mockResolvedValue({ id: 's1' });
    progressRepo.hasCompletedStep.mockResolvedValue(true);

    await useCase.execute('user', { serverId: 's1', vmCount: 2 });

    expect(repo.findOneByField).toHaveBeenCalled();
    expect(completeStep.execute).toHaveBeenCalledWith(SetupStep.VM_DISCOVERY, 'user', expect.any(Object));
  });

  it('throws when server step not completed', async () => {
    repo.findOneByField.mockResolvedValue({ id: 's1' });
    progressRepo.hasCompletedStep.mockResolvedValue(false);

    await expect(
      useCase.execute('user', { serverId: 's1', vmCount: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates errors from repository', async () => {
    repo.findOneByField.mockRejectedValue(new Error('fail'));
    await expect(
      useCase.execute('u', { serverId: 'x', vmCount: 1 }),
    ).rejects.toThrow('fail');
  });
});
