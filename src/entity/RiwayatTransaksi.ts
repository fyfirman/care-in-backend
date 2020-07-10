import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { Transaksi } from './Transaksi'
import { Pasien } from './Pasien'
import { Nakes } from './Nakes'
import { IsPositive, IsNotEmpty } from 'class-validator'

@Entity()
export class RiwayatTransaksi extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  transaksiId: string
  @OneToOne(() => Transaksi)
  @JoinColumn({ name: 'transaksiId' })
  transaksi: Transaksi

  @Column()
  pasienId: string
  @ManyToOne(() => Pasien, (pasien) => pasien.riwayatTransaksi)
  @JoinColumn({ name: 'pasienId' })
  pasien: Pasien

  @Column()
  nakesId: string
  @ManyToOne(() => Nakes, (nakes) => nakes.riwayatTransaksi)
  @JoinColumn({ name: 'nakesId' })
  nakes: Nakes

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsPositive({ message: 'biaya jasa harus bernilai positif' })
  @IsNotEmpty({ message: 'biaya jasa harus diisi' })
  biayaJasa: number

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsPositive({ message: 'biaya transpor harus bernilai positif' })
  @IsNotEmpty({ message: 'biaya transpor harus diisi' })
  biayaTranspor: number

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsPositive({ message: 'biaya admin harus bernilai positif' })
  @IsNotEmpty({ message: 'biaya admin harus diisi' })
  biayaAdmin: number

  @Column({ default: 'now()' })
  waktuDibuat: 'timestamp'

  @Column({ default: false })
  sakit: boolean

  @Column()
  namaPenyakit: string

  @Column()
  catatan: string
}
