import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EncryptionTransformer } from '@/core/transformers/encryption.transformer';

@Entity('ilo')
export class Ilo extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty()
  @Column({ 
    type: 'varchar',
    transformer: new EncryptionTransformer(),
  })
  password!: string;
}
