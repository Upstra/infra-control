import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs/promises';
import { YamlFileRepository } from '../yaml-file.repository';

jest.mock('fs/promises');

describe('YamlFileRepository', () => {
  let repository: YamlFileRepository;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('/home/upstra/ups_manager'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YamlFileRepository,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    repository = module.get<YamlFileRepository>(YamlFileRepository);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('write', () => {
    it('should write content to file', async () => {
      const filename = 'test.yml';
      const content = 'yaml content';
      const expectedPath = '/home/upstra/ups_manager/plans/test.yml';

      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.write(filename, content);

      expect(fs.mkdir).toHaveBeenCalledWith('/home/upstra/ups_manager/plans', {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, content, 'utf8');
      expect(result).toBe(expectedPath);
    });

    it('should throw HttpException on write error', async () => {
      const filename = 'test.yml';
      const content = 'yaml content';
      const error = new Error('Write failed');

      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(repository.write(filename, content)).rejects.toThrow(
        new HttpException(
          'Failed to write migration plan: Write failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('read', () => {
    it('should read content from file', async () => {
      const filename = 'test.yml';
      const content = 'yaml content';

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      const result = await repository.read(filename);

      expect(fs.readFile).toHaveBeenCalledWith(
        '/home/upstra/ups_manager/plans/test.yml',
        'utf8',
      );
      expect(result).toBe(content);
    });

    it('should throw HttpException on read error', async () => {
      const filename = 'test.yml';
      const error = new Error('Read failed');

      (fs.readFile as jest.Mock).mockRejectedValue(error);

      await expect(repository.read(filename)).rejects.toThrow(
        new HttpException(
          'Migration plan not found: test.yml',
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      const filename = 'test.yml';

      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await repository.delete(filename);

      expect(fs.unlink).toHaveBeenCalledWith(
        '/home/upstra/ups_manager/plans/test.yml',
      );
    });

    it('should throw HttpException on delete error', async () => {
      const filename = 'test.yml';
      const error = new Error('Delete failed');

      (fs.unlink as jest.Mock).mockRejectedValue(error);

      await expect(repository.delete(filename)).rejects.toThrow(
        new HttpException(
          'Migration plan not found: test.yml',
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe('list', () => {
    it('should list YAML files', async () => {
      const files = ['test1.yml', 'test2.yaml', 'other.txt', 'test3.yml'];
      const expected = ['test1.yml', 'test2.yaml', 'test3.yml'];

      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue(files);

      const result = await repository.list();

      expect(fs.mkdir).toHaveBeenCalledWith('/home/upstra/ups_manager/plans', {
        recursive: true,
      });
      expect(fs.readdir).toHaveBeenCalledWith('/home/upstra/ups_manager/plans');
      expect(result).toEqual(expected);
    });

    it('should return empty array on error', async () => {
      const error = new Error('List failed');

      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      const result = await repository.list();

      expect(result).toEqual([]);
    });
  });
});
