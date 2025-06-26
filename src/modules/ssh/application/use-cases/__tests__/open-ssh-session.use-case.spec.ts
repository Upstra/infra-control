import { OpenSshSessionUseCase } from '../open-ssh-session.use-case';
import { SshService } from '../../../domain/services/ssh.service';

describe('OpenSshSessionUseCase', () => {
  it('should delegate to SshService', async () => {
    const sshService = {
      createSession: jest.fn().mockResolvedValue('session'),
    } as unknown as SshService;
    const useCase = new OpenSshSessionUseCase(sshService);
    const result = await useCase.execute({
      host: 'h',
      username: 'u',
      password: 'p',
    });
    expect(sshService.createSession).toHaveBeenCalledWith({
      host: 'h',
      username: 'u',
      password: 'p',
    });
    expect(result).toBe('session');
  });
});
