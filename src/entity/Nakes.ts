import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  AfterLoad,
  Index,
} from 'typeorm'
import { IsPositive, IsNotEmpty, IsEmail, IsNumberString } from 'class-validator'
import { Transaksi } from './Transaksi'
import { Chat } from './Chat'
import { RiwayatTransaksi } from './RiwayatTransaksi'
import pointFormat from '../util/pointFormat'
import { DSAKeyPairKeyObjectOptions } from 'crypto'

@Entity()
export class Nakes extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  jenis: string

  @Column({ type: 'decimal', precision: 11, scale: 2 })
  @IsPositive({ message: 'harga harus bernilai positif' })
  @IsNotEmpty({ message: 'harga harus diisi' })
  harga: number

  @Column()
  @IsNotEmpty({ message: 'nama harus diisi' })
  nama: string

  @Column({ unique: true })
  @IsNotEmpty({ message: 'email harus diisi' })
  @IsEmail({}, { message: 'email tidak valid' })
  email: string

  @Column({ unique: true })
  @IsNotEmpty({ message: 'nomor telepon harus diisi' })
  @IsNumberString({}, { message: 'nomor telepon harus berupa angka' })
  noTelp: string

  @Column({ unique: true })
  @IsNotEmpty({ message: 'username harus diisi' })
  username: string

  @Column()
  password: string

  @Column({ default: false })
  berbagiLokasi: boolean

  @Column('point')
  @Index({ spatial: true })
  lokasi: string | Object

  @Column({ nullable: false })
  foto: string

  @AfterLoad() _convertNumerics() {
    this.harga = parseFloat(this.harga as any)
  }
  @AfterLoad() _convertPoints() {
    this.lokasi = pointFormat(this.lokasi)
  }

  @OneToMany(() => Transaksi, (transaksi) => transaksi.nakes)
  transaksi: Transaksi[]

  @OneToMany(() => Chat, (chat) => chat.nakes)
  chat: Chat[]

  @OneToMany(() => RiwayatTransaksi, (riwayatTransaksi) => riwayatTransaksi.nakes)
  riwayatTransaksi: RiwayatTransaksi[]
}
