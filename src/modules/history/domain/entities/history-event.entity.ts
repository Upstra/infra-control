import { BaseEntity, CreateDateColumn, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('history_event')
export class HistoryEvent extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Entity type, e.g. user, server' })
  @Column()
  entity!: string;

  @ApiProperty({ description: 'Identifier of the entity instance' })
  @Column()
  entityId!: string;

  @ApiProperty({ description: 'Action performed like CREATE, UPDATE, DELETE' })
  @Column()
  action!: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
