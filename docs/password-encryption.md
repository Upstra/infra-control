# Password Encryption

## Overview

This application uses AES-256-GCM encryption to protect sensitive passwords stored in the database. All server and iLO passwords are automatically encrypted before storage and decrypted when accessed.

## Configuration

### Environment Variable

You must set the `ENCRYPTION_KEY` environment variable with a strong secret key:

```bash
# .env
ENCRYPTION_KEY=your-very-strong-secret-key-minimum-32-characters
```

**Important**: 
- The encryption key must be kept secret and secure
- Never commit the encryption key to version control
- Use a different key for each environment (dev, staging, production)
- Back up this key securely - losing it means losing access to all encrypted passwords

### Key Generation

To generate a secure encryption key:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Implementation Details

### Encrypted Fields

The following fields are automatically encrypted:
- `Server.password` - vCenter/ESXi credentials
- `Ilo.password` - iLO management credentials

### How It Works

1. **Encryption**: When saving a password, the TypeORM transformer automatically encrypts it using AES-256-GCM
2. **Storage**: The encrypted password is stored as a base64-encoded string in the database
3. **Decryption**: When reading a password (using `addSelect` or specific queries), it's automatically decrypted

### Security Features

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: Uses scrypt for key derivation from the encryption key
- **IV**: Random initialization vector for each encryption
- **Authentication**: GCM mode provides built-in authentication

## Migration for Existing Data

If you have existing unencrypted passwords in your database, you'll need to create a migration to encrypt them:

```typescript
// Example migration
export class EncryptExistingPasswords1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Load all servers with passwords
    const servers = await queryRunner.query(
      'SELECT id, password FROM server WHERE password IS NOT NULL'
    );
    
    // Encrypt each password
    for (const server of servers) {
      const encryptedPassword = encryptionService.encrypt(server.password);
      await queryRunner.query(
        'UPDATE server SET password = ? WHERE id = ?',
        [encryptedPassword, server.id]
      );
    }
    
    // Similar for iLO passwords
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Decrypt passwords if needed
  }
}
```

## Troubleshooting

### "EncryptionService not initialized" Error

This error occurs when the TypeORM transformer tries to encrypt/decrypt before the service is initialized. This should not happen in normal operation but might occur during testing.

### "Failed to decrypt data" Error

This can occur when:
- The encryption key has changed
- The encrypted data is corrupted
- Trying to decrypt data that wasn't encrypted

### Performance Considerations

- Encryption/decryption adds minimal overhead (~1-2ms per operation)
- The transformer only runs when the password field is selected or updated
- No impact on queries that don't involve password fields

## Best Practices

1. **Key Rotation**: Plan for key rotation by keeping track of which key version encrypted each password
2. **Backup**: Always backup both the encrypted data AND the encryption key
3. **Access Control**: Limit access to the encryption key to only necessary personnel
4. **Monitoring**: Log encryption/decryption failures for security monitoring
5. **Testing**: Always test password encryption in a safe environment before production