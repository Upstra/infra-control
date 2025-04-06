import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('group')
export abstract class Group extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  priority: number;
}
