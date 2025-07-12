import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from '../core/services/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

export class EncryptExistingPasswords1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a temporary encryption service for the migration
    const configService = new ConfigService();
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be defined to run this migration');
    }

    // Mock config service
    const mockConfigService = {
      get: (key: string) => {
        if (key === 'ENCRYPTION_KEY') return encryptionKey;
        return process.env[key];
      },
    } as ConfigService;

    const encryptionService = new EncryptionService(mockConfigService);

    // Encrypt server passwords
    const servers = await queryRunner.query(
      'SELECT id, password FROM server WHERE password IS NOT NULL'
    );

    for (const server of servers) {
      try {
        // Check if already encrypted (base64 check)
        Buffer.from(server.password, 'base64');
        encryptionService.decrypt(server.password);
        console.log(`Server ${server.id} password already encrypted, skipping...`);
        continue;
      } catch {
        // Not encrypted, encrypt it
        const encryptedPassword = encryptionService.encrypt(server.password);
        await queryRunner.query(
          'UPDATE server SET password = $1 WHERE id = $2',
          [encryptedPassword, server.id]
        );
        console.log(`Encrypted password for server ${server.id}`);
      }
    }

    // Encrypt iLO passwords
    const ilos = await queryRunner.query(
      'SELECT id, password FROM ilo WHERE password IS NOT NULL'
    );

    for (const ilo of ilos) {
      try {
        // Check if already encrypted
        Buffer.from(ilo.password, 'base64');
        encryptionService.decrypt(ilo.password);
        console.log(`iLO ${ilo.id} password already encrypted, skipping...`);
        continue;
      } catch {
        // Not encrypted, encrypt it
        const encryptedPassword = encryptionService.encrypt(ilo.password);
        await queryRunner.query(
          'UPDATE ilo SET password = $1 WHERE id = $2',
          [encryptedPassword, ilo.id]
        );
        console.log(`Encrypted password for iLO ${ilo.id}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Decryption in down migration is risky and not recommended
    // Passwords should remain encrypted
    console.warn(
      'Down migration for password encryption is not implemented. ' +
      'Decrypting passwords would be a security risk.'
    );
  }
}