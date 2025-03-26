import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('groupe')
export class Groupe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
