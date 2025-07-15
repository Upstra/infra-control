import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class YamlFileRepository {
  private readonly logger = new Logger(YamlFileRepository.name);
  private readonly upsManagerPath: string;

  constructor(private readonly configService: ConfigService) {
    const pythonScriptsPath = this.configService.get<string>(
      'PYTHON_SCRIPTS_PATH',
      '/home/upstra/ups_manager',
    );
    this.upsManagerPath = path.join(pythonScriptsPath, 'plans');
  }

  async write(filename: string, content: string): Promise<string> {
    try {
      await this.ensureDirectoryExists();
      const filePath = this.getFilePath(filename);
      await fs.writeFile(filePath, content, 'utf8');
      this.logger.log(`File written successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to write file: ${error.message}`);
      throw new HttpException(
        `Failed to write migration plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async read(filename: string): Promise<string> {
    try {
      const filePath = this.getFilePath(filename);
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to read file: ${error.message}`);
      throw new HttpException(
        `Migration plan not found: ${filename}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      const filePath = this.getFilePath(filename);
      await fs.unlink(filePath);
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new HttpException(
        `Migration plan not found: ${filename}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async list(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.upsManagerPath);
      return files.filter(file => this.isYamlFile(file));
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      return [];
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    await fs.mkdir(this.upsManagerPath, { recursive: true });
  }

  private getFilePath(filename: string): string {
    return path.join(this.upsManagerPath, filename);
  }

  private isYamlFile(filename: string): boolean {
    return filename.endsWith('.yml') || filename.endsWith('.yaml');
  }
}