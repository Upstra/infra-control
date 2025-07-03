import { PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class Group extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  priority: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ default: true })
  cascade: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  roomId?: string;
}
