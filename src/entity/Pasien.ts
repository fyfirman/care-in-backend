import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { IsNotEmpty, IsDate, Length, IsEmail, IsNumberString } from 'class-validator'
import { RiwayatKesehatan } from './RiwayatKesehatan'
import { Transaksi } from './Transaksi'
import { Chat } from './Chat'
import { RiwayatTransaksi } from './RiwayatTransaksi'

@Entity()
export class Pasien extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @IsNotEmpty({ message: 'nama harus diisi' })
  nama: string

  @Column()
  @IsDate({ message: 'tanggal lahir tidak valid' })
  tglLahir: Date

  @Column({ type: 'char', length: 1 })
  @IsNotEmpty({ message: 'jenis kelamin harus diisi' })
  @Length(1, 1, { message: 'jenis kelamin harus satu karakter' })
  jk: string

  @Column({ length: 20, unique: true })
  @IsNotEmpty({ message: 'nomor telepon harus diisi' })
  @IsNumberString({}, { message: 'nomor telepon harus berupa angka' })
  noTelp: string

  @Column({ unique: true })
  @IsEmail({}, { message: 'email tidak valid' })
  email: string

  @Column({ unique: true })
  @IsNotEmpty({ message: 'username harus diisi' })
  username: string

  @Column({ type: 'varbinary' })
  password: string

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  beratBadan: number

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  tinggiBadan: number

  @Column({ nullable: true, length: 2 })
  goldar: string

  @Column({ nullable: true })
  tempatLahir: string

  @Column({ nullable: true })
  foto: string

  @OneToMany(() => RiwayatKesehatan, (riwayatKesehatan) => riwayatKesehatan.pasien)
  riwayatKesehatan: RiwayatKesehatan[]

  @OneToMany(() => Transaksi, (transaksi) => transaksi.pasien)
  transaksi: Transaksi[]

  @OneToMany(() => Chat, (chat) => chat.pasien)
  chat: Chat[]

  @OneToMany(() => RiwayatTransaksi, (riwayatTransaksi) => riwayatTransaksi.pasien)
  riwayatTransaksi: RiwayatTransaksi[]
}
