import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { Transaksi } from './Transaksi'
import { Pasien } from './Pasien'
import { Nakes } from './Nakes'

@Entity()
export class Chat extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  transaksiId: string
  @OneToOne(() => Transaksi)
  @JoinColumn({ name: 'transaksiId' })
  transaksi: Transaksi

  @Column()
  pasienId: string
  @ManyToOne(() => Pasien, (pasien) => pasien.chat)
  @JoinColumn({ name: 'pasienId' })
  pasien: Pasien

  @Column()
  nakesId: string
  @ManyToOne(() => Nakes, (nakes) => nakes.chat)
  @JoinColumn({ name: 'nakesId' })
  nakes: Nakes

  @Column()
  isi: string

  @Column({ default: 'now()' })
  waktuDibuat: 'timestamp'
}
