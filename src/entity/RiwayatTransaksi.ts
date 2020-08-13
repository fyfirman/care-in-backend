import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  AfterLoad,
} from 'typeorm'
import { Transaksi } from './Transaksi'
import { Pasien } from './Pasien'
import { Nakes } from './Nakes'
import { IsNotEmpty } from 'class-validator'

@Entity()
export class RiwayatTransaksi extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  transaksiId: string
  @OneToOne(() => Transaksi, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaksiId' })
  transaksi: Transaksi

  @Column()
  pasienId: string
  @ManyToOne(() => Pasien, (pasien) => pasien.riwayatTransaksi, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pasienId' })
  pasien: Pasien

  @Column()
  nakesId: string
  @ManyToOne(() => Nakes, (nakes) => nakes.riwayatTransaksi, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'nakesId' })
  nakes: Nakes

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsNotEmpty({ message: 'biaya jasa harus diisi' })
  biayaJasa: number

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsNotEmpty({ message: 'biaya transpor harus diisi' })
  biayaTranspor: number

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsNotEmpty({ message: 'biaya admin harus diisi' })
  biayaAdmin: number

  totalBiaya: number

  @Column({ default: false })
  telahSetor: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  waktuDibuat: 'timestamp'

  @Column({ default: false })
  sakit: boolean

  @Column({ nullable: true })
  namaPenyakit: string

  @Column({ nullable: true })
  catatan: string

  @Column({ default: false })
  berhasil: boolean

  @AfterLoad() _convertNumerics() {
    this.biayaJasa = parseFloat(this.biayaJasa as any)
    this.biayaTranspor = parseFloat(this.biayaTranspor as any)
    this.biayaAdmin = parseFloat(this.biayaAdmin as any)
    this.totalBiaya = this.biayaJasa + this.biayaTranspor
  }
}
