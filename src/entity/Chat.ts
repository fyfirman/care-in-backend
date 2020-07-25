import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm'
import { Transaksi } from './Transaksi'
import { Pasien } from './Pasien'
import { Nakes } from './Nakes'

@Entity()
export class Chat extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  transaksiId: string
  @ManyToOne(() => Transaksi, (transaksi) => transaksi.chat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaksiId' })
  transaksi: Transaksi

  @Column('uuid')
  pengirimId: string

  @Column()
  isi: string

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  waktuDibuat: 'timestamp'
}
