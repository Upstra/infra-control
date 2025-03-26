import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('serveur')
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
