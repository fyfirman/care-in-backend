import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Pasien } from './Pasien'
import { Nakes } from './Nakes'

@Entity()
export class Transaksi extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  pasienId: string
  @ManyToOne(() => Pasien, (pasien) => pasien.transaksi)
  @JoinColumn({ name: 'pasienId' })
  pasien: Pasien

  @Column()
  nakesId: string
  @ManyToOne(() => Nakes, (nakes) => nakes.transaksi)
  @JoinColumn({ name: 'nakesId' })
  nakes: Nakes

  @Column('point')
  @Index({ spatial: true })
  pasienLokasi: string

  @Column('point')
  @Index({ spatial: true })
  nakesLokasi: string

  @Column({ default: false })
  berhasil: boolean

  @Column()
  status: string

  @Column({ default: 'now()' })
  waktuDibuat: 'timestamp'
}
