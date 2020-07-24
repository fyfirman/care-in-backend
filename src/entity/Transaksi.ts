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
import { AfterLoad } from 'typeorm'
import pointFormat from '../util/pointFormat'

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
  pasienLokasi: string | Object

  @Column('point')
  @Index({ spatial: true })
  nakesLokasi: string | Object

  @Column()
  meter: number

  @Column({ default: false })
  berhasil: boolean

  @Column()
  status: string

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  waktuDibuat: 'timestamp'

  @AfterLoad() _convertPoints() {
    this.pasienLokasi = pointFormat(this.pasienLokasi)
    this.nakesLokasi = pointFormat(this.nakesLokasi)
  }
}
