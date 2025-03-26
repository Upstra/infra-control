import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('salle')
export class Salle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
