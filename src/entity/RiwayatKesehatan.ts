import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm'
import { Pasien } from './Pasien'
import { IsDate, IsNotEmpty } from 'class-validator'

@Entity()
export class RiwayatKesehatan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  pasienId: string
  @ManyToOne(() => Pasien, (pasien) => pasien.riwayatKesehatan, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pasienId' })
  pasien: Pasien

  @Column()
  @IsDate({ message: 'tanggal tidak valid' })
  tanggal: Date

  @Column()
  @IsNotEmpty({ message: 'nama penyakit harus diisi' })
  namaPenyakit: string
}
