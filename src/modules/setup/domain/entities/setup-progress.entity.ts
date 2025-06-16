import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { SetupStep } from '../../application/dto/setup-status.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SetupProgress {
  @ApiProperty({
    description: 'Unique identifier for the setup progress entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The step of the setup process that has been completed',
    enum: SetupStep,
    example: SetupStep.CREATE_ROOM,
  })
  @Column({
    type: 'enum',
    enum: SetupStep,
  })
  step: SetupStep;
  @ApiProperty({
    description: 'Timestamp when the setup step was completed',
    example: '2023-10-01T12:00:00Z',
  })
  @Column({ type: 'timestamp' })
  completedAt: Date;

  @ApiProperty({
    description: 'User ID of the person who completed the setup step',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column({ type: 'varchar' })
  completedBy: string;

  @ApiProperty({
    description: 'Additional metadata related to the setup step',
    example: { notes: 'Initial room setup completed' },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
