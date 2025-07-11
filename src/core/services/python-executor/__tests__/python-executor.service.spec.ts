import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PythonExecutorService } from '../python-executor.service';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
  },
}));

describe('PythonExecutorService', () => {
  let service: PythonExecutorService;
  let configService: ConfigService;
  let mockProcess: any;

  beforeEach(async () => {
    mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.kill = jest.fn();
    mockProcess.killed = false;

    (spawn as jest.Mock).mockReturnValue(mockProcess);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonExecutorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'PYTHON_PATH':
                  return 'python3';
                case 'PYTHON_SCRIPTS_PATH':
                  return '/home/upstra/ups_manager';
                case 'PYTHON_EXECUTION_TIMEOUT':
                  return 300000;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PythonExecutorService>(PythonExecutorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executePython', () => {
    it('should execute python script successfully and return JSON result', async () => {
      const scriptName = 'test_script.py';
      const args = ['--arg1', 'value1'];
      const expectedResult = { status: 'success', data: 'test' };

      const executionPromise = service.executePython(scriptName, args);

      setTimeout(() => {
        mockProcess.stdout.emit('data', JSON.stringify(expectedResult));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executionPromise;

      expect(spawn).toHaveBeenCalledWith(
        'python3',
        ['/home/upstra/ups_manager/test_script.py', '--arg1', 'value1'],
        expect.objectContaining({
          env: expect.any(Object),
        }),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should return string output when JSON parsing fails', async () => {
      const scriptName = 'test_script.py';
      const expectedOutput = 'Plain text output';

      const executionPromise = service.executePython(scriptName);

      setTimeout(() => {
        mockProcess.stdout.emit('data', expectedOutput);
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executionPromise;

      expect(result).toBe(expectedOutput);
    });

    it('should handle script execution failure', async () => {
      const scriptName = 'test_script.py';
      const errorMessage = 'Script error occurred';

      const executionPromise = service.executePython(scriptName);

      setTimeout(() => {
        mockProcess.stderr.emit('data', errorMessage);
        mockProcess.emit('close', 1);
      }, 10);

      await expect(executionPromise).rejects.toThrow(errorMessage);
    });

    it('should handle process spawn error', async () => {
      const scriptName = 'test_script.py';
      const errorMessage = 'spawn error';

      const executionPromise = service.executePython(scriptName);

      setTimeout(() => {
        mockProcess.emit('error', new Error(errorMessage));
      }, 10);

      await expect(executionPromise).rejects.toThrow(`Failed to execute Python script: ${errorMessage}`);
    });

    it.skip('should handle timeout', async () => {
      // TODO: Fix timeout test
    });

    it('should use custom environment variables', async () => {
      const scriptName = 'test_script.py';
      const customEnv = { CUSTOM_VAR: 'custom_value' };

      const executionPromise = service.executePython(scriptName, [], { env: customEnv });

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'success');
        mockProcess.emit('close', 0);
      }, 10);

      await executionPromise;

      expect(spawn).toHaveBeenCalledWith(
        'python3',
        ['/home/upstra/ups_manager/test_script.py'],
        expect.objectContaining({
          env: expect.objectContaining(customEnv),
        }),
      );
    });

    it('should handle empty output', async () => {
      const scriptName = 'test_script.py';

      const executionPromise = service.executePython(scriptName);

      setTimeout(() => {
        mockProcess.stdout.emit('data', '   \n  ');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executionPromise;

      expect(result).toBeNull();
    });

    it('should force kill process if SIGTERM fails', async () => {
      const scriptName = 'test_script.py';
      const timeout = 100;

      jest.useFakeTimers();

      service.executePython(scriptName, [], { timeout });

      jest.advanceTimersByTime(timeout + 1);
      
      mockProcess.killed = false;
      jest.advanceTimersByTime(5001);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

      jest.useRealTimers();
    });
  });

  describe('validateScriptExists', () => {
    it('should return true when script exists', async () => {
      const fs = await import('fs');
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.validateScriptExists('test_script.py');

      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith('/home/upstra/ups_manager/test_script.py');
    });

    it('should return false when script does not exist', async () => {
      const fs = await import('fs');
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await service.validateScriptExists('nonexistent.py');

      expect(result).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should use default values when config is not provided', async () => {
      const mockConfigGet = jest.fn().mockReturnValue(undefined);
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PythonExecutorService,
          {
            provide: ConfigService,
            useValue: {
              get: mockConfigGet,
            },
          },
        ],
      }).compile();

      const serviceWithDefaults = module.get<PythonExecutorService>(PythonExecutorService);
      
      const executionPromise = serviceWithDefaults.executePython('test.py');

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'success');
        mockProcess.emit('close', 0);
      }, 10);

      await executionPromise;

      expect(spawn).toHaveBeenCalledWith(
        'python3',
        ['/home/upstra/ups_manager/test.py'],
        expect.any(Object),
      );
    });
  });
});