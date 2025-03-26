import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ilo')
export class Ilo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
