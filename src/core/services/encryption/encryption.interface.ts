export interface EncryptionServiceInterface {
  encrypt(plainText: string): string;
  decrypt(encryptedText: string): string;
}