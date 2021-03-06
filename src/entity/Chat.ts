import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm'
import { Transaksi } from './Transaksi'

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  waktuDibuat: 'timestamp'
}
