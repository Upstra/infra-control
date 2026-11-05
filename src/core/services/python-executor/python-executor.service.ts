import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export const SECRET_ARGUMENTS: Record<string, string> = {
  '--password': 'UPSTRA_PASSWORD',
  '--community': 'UPSTRA_SNMP_COMMUNITY',
};

export interface PreparedArguments {
  args: string[];
  env: Record<string, string>;
}

export interface PythonScriptOptions {
  timeout?: number;
  env?: Record<string, string>;
}

@Injectable()
export class PythonExecutorService {
  private readonly logger = new Logger(PythonExecutorService.name);
  private readonly pythonPath: string;
  private readonly scriptsBasePath: string;
  private readonly defaultTimeout: number;

  constructor(private readonly configService: ConfigService) {
    this.pythonPath =
      this.configService.get<string>('PYTHON_PATH') ?? 'python3';
    this.scriptsBasePath =
      this.configService.get<string>('PYTHON_SCRIPTS_PATH') ??
      '/home/upstra/ups_manager';
    this.defaultTimeout =
      this.configService.get<number>('PYTHON_TIMEOUT') ?? 300000;
  }

  async executePython(
    scriptName: string,
    args: string[] = [],
    options: PythonScriptOptions = {},
  ): Promise<any> {
    const startTime = Date.now();
    const timeout = options.timeout ?? this.defaultTimeout;
    const bashScriptName = scriptName.replace('.py', '.sh');
    const scriptPath = `${this.scriptsBasePath}/${bashScriptName}`;

    const prepared = this.prepareArguments(args);
    const maskedArgs = this.maskSensitiveArgs(prepared.args);
    this.logger.log(
      `Executing bash script: ${scriptPath} with args: ${maskedArgs.join(' ')}`,
    );

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('bash', [scriptPath, ...prepared.args], {
        env: {
          ...process.env,
          ...this.tlsEnvironment(),
          ...options.env,
          ...prepared.env,
        },
        cwd: this.scriptsBasePath,
      });

      let stdout = '';
      let stderr = '';
      let processKilled = false;

      const timeoutId = setTimeout(() => {
        processKilled = true;
        pythonProcess.kill('SIGTERM');
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.debug(`Python stderr: ${data.toString()}`);
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        this.logger.error(`Failed to start Python process: ${error.message}`);
        reject(new Error(`Failed to execute Python script: ${error.message}`));
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (processKilled) {
          this.logger.error(
            `Script ${scriptName} timed out after ${timeout}ms`,
          );
          reject(new Error(`Script execution timeout after ${timeout}ms`));
          return;
        }

        if (code !== 0) {
          const errorMessage =
            stderr.trim() ||
            stdout.trim() ||
            `Script execution failed with code ${code}`;
          this.logger.error(
            `Script ${bashScriptName} failed with code ${code}: ${errorMessage}`,
          );
          reject(new Error(errorMessage));
          return;
        }

        try {
          const result = this.parseOutput(stdout);
          this.logger.log(
            `Script ${scriptName} completed successfully in ${duration}ms`,
          );
          resolve(result);
        } catch (error) {
          this.logger.error(`Failed to parse script output: ${error.message}`);
          reject(new Error(`Invalid script output: ${error.message}`));
        }
      });
    });
  }

  private parseOutput(output: string): any {
    const trimmedOutput = output.trim();

    if (!trimmedOutput) {
      return null;
    }

    try {
      return JSON.parse(trimmedOutput);
    } catch {
      return trimmedOutput;
    }
  }

  async validateScriptExists(scriptName: string): Promise<boolean> {
    const bashScriptName = scriptName.replace('.py', '.sh');
    const scriptPath = `${this.scriptsBasePath}/${bashScriptName}`;
    try {
      const { promises: fs } = await import('fs');
      await fs.access(scriptPath);
      return true;
    } catch {
      return false;
    }
  }

  prepareArguments(args: string[]): PreparedArguments {
    const kept: string[] = [];
    const env: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
      const variable = SECRET_ARGUMENTS[args[i]?.toLowerCase()];
      if (variable && i + 1 < args.length) {
        env[variable] = args[i + 1];
        i++;
        continue;
      }
      kept.push(args[i]);
    }
    return { args: kept, env };
  }

  tlsEnvironment(): Record<string, string> {
    const env: Record<string, string> = {
      UPSTRA_VERIFY_SSL: String(
        this.configService.get('PYTHON_VERIFY_SSL') ?? 'false',
      ),
    };
    const caBundle = this.configService.get<string>('PYTHON_CA_BUNDLE');
    if (caBundle) env.UPSTRA_CA_BUNDLE = caBundle;
    return env;
  }

  private maskSensitiveArgs(args: string[]): string[] {
    const sensitiveKeys = [
      '--password',
      '--pass',
      '--pwd',
      '--secret',
      '--key',
      '--token',
      '--community',
    ];
    const maskedArgs = [...args];

    for (let i = 0; i < maskedArgs.length; i++) {
      if (
        sensitiveKeys.includes(maskedArgs[i].toLowerCase()) &&
        i + 1 < maskedArgs.length
      ) {
        maskedArgs[i + 1] = '[REDACTED]';
      }
    }

    return maskedArgs;
  }
}
