import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('vm')
export class VM {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
