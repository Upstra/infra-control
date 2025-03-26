import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('onduleur')
export class Onduleur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
