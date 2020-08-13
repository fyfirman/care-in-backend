import { Request, Response } from 'express'
import { Transaksi } from '../entity/Transaksi'
import responseLogger from '../util/responseLogger'
import { Nakes } from '../entity/Nakes'
import { RiwayatTransaksi } from '../entity/RiwayatTransaksi'
import { RiwayatKesehatan } from '../entity/RiwayatKesehatan'
import { Not, getRepository } from 'typeorm'
import { Chat } from '../entity/Chat'
import calcBiayaTranspor from '../util/calcBiayaTranspor'

enum StatusTransaksi {
  pending = 'pending',
  berjalan = 'berjalan',
  selesai = 'selesai',
}

export const pesanNakes = async (req: Request, res: Response) => {
  const pasienId = req.user.id
  const nakesId = req.params.nakesId

  const {
    pasienLokasi, // Geopoint { lat: -6.89693, lng: 107.55995 }
    jarak,
  } = req.body

  try {
    const nakes = await Nakes.findOne(nakesId)
    if (!nakes) throw new Error('Nakes tidak ditemukan')
    if ((jarak && jarak < 0) || !pasienLokasi) throw new Error('Data tidak lengkap')

    const transaksiBerjalan = await Transaksi.findOne({
      where: {
        pasienId,
        status: Not('selesai'),
      },
    })

    if (transaksiBerjalan) throw new Error('Anda masih memiliki transaksi yang sedang berjalan')

    const transaksi = new Transaksi()

    transaksi.pasienId = pasienId
    transaksi.nakesId = nakesId
    transaksi.pasienLokasi = `POINT(${pasienLokasi.lat} ${pasienLokasi.lng})`
    transaksi.nakesLokasi = `POINT(${nakes.lokasi['lat']} ${nakes.lokasi['lng']})`
    transaksi.meter = jarak
    transaksi.status = 'pending' //pending, berjalan, selesai

    await Transaksi.save(transaksi)
    await Nakes.update(nakesId, { berbagiLokasi: false })

    responseLogger(req.method, 201, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil memesan',
    })
  } catch (err) {
    let statusCode = 500

    if (err.message === 'Nakes tidak ditemukan') statusCode = 404
    if (err.message === 'Data tidak lengkap') statusCode = 400
    if (err.message === 'Anda masih memiliki transaksi yang sedang berjalan') statusCode = 406

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const updateOneTransaksi = async (req: Request, res: Response) => {
  const transaksiId = req.params.transaksiId
  let {
    status,
    berhasil,
    biayaJasa,
    biayaAdmin,
    biayaTranspor,
    sakit,
    namaPenyakit,
    catatan,
  } = req.body

  const transaksi = await Transaksi.findOne(transaksiId, {
    join: {
      alias: 'transaksi',
      innerJoinAndSelect: {
        nakes: 'transaksi.nakes',
      },
    },
  })

  const updateState = {
    status: transaksi && transaksi.status,
    berhasil: transaksi && transaksi.berhasil,
  }

  try {
    if (berhasil === undefined || !status) throw new Error('Data tidak valid')

    if (!transaksi) throw new Error('Transaksi tidak ditemukan')

    if (status) {
      let statusIsValid = false
      for (let s in StatusTransaksi) {
        if (status === s) {
          updateState.status = status
          statusIsValid = true
        }
      }
      if (!statusIsValid) throw new Error('Status tidak valid')
    }
    if (berhasil === true) updateState.berhasil = true
    if (berhasil === false) updateState.berhasil = false

    await Transaksi.update(
      { id: transaksiId },
      {
        status: updateState.status,
        berhasil: updateState.berhasil,
      },
    )

    if (updateState.status === 'selesai') {
      await Nakes.update(transaksi.nakesId, { berbagiLokasi: true })
    }

    if (updateState.status === 'selesai') {
      let isExist = true
      let riwayatTransaksi = await RiwayatTransaksi.findOne({
        where: {
          transaksiId: transaksiId,
        },
      })

      if (!riwayatTransaksi) {
        isExist = false
        riwayatTransaksi = new RiwayatTransaksi()
      }

      if (!biayaJasa) biayaJasa = transaksi.nakes.harga

      let biayaAwalAdmin = parseFloat(process.env.ADMIN_PERCENT_PRICE)
      if (!biayaAdmin) biayaAdmin = transaksi.nakes.harga * biayaAwalAdmin

      if (!biayaTranspor) biayaTranspor = calcBiayaTranspor(transaksi.meter)
      else biayaTranspor = parseInt(biayaTranspor)

      if (sakit === true) sakit = true

      riwayatTransaksi.transaksiId = transaksiId
      riwayatTransaksi.pasienId = transaksi.pasienId
      riwayatTransaksi.nakesId = transaksi.nakesId
      riwayatTransaksi.biayaJasa = biayaJasa
      riwayatTransaksi.biayaAdmin = biayaAdmin
      riwayatTransaksi.biayaTranspor = biayaTranspor
      riwayatTransaksi.sakit = sakit || false
      riwayatTransaksi.namaPenyakit = sakit ? namaPenyakit || '' : null
      riwayatTransaksi.catatan = catatan
      riwayatTransaksi.berhasil = updateState.berhasil

      await RiwayatTransaksi.save(riwayatTransaksi)

      if (!isExist && sakit) {
        const riwayatKesehatan = new RiwayatKesehatan()

        riwayatKesehatan.pasienId = transaksi.pasienId
        riwayatKesehatan.namaPenyakit = namaPenyakit
        riwayatKesehatan.tanggal = new Date()

        await RiwayatKesehatan.save(riwayatKesehatan)
      }
    } else {
      const riwayat = await RiwayatTransaksi.findOne({
        where: { transaksiId },
      })

      if (riwayat) {
        await RiwayatTransaksi.delete({ transaksiId })
      }
    }

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil update transaksi',
    })
  } catch (err) {
    await Transaksi.update(
      { id: transaksiId },
      {
        status: updateState.status,
        berhasil: updateState.berhasil,
      },
    )
    let statusCode = 500
    if (err.message === 'Transaksi tidak ditemukan') statusCode = 404
    if (err.message === 'Status tidak valid') statusCode = 400
    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const getRiwayatTransaksi = async (req: Request, res: Response) => {
  let { user, limit, page, berhasil } = req.query

  const whereId = user === 'nakes' ? 'nakesId' : 'pasienId'

  type ResultRiwayat = {
    transaksiBerjalan?: Object
    riwayatTransaksi?: Object[]
  }

  const result: ResultRiwayat = {
    riwayatTransaksi: [],
  }

  try {
    if ((limit as any) < 0 || (page as any) < 1)
      throw new Error('Paginasi error, nilai tidak valid')

    const transaksiBerjalan = await Transaksi.findOne({
      where: {
        [whereId]: req.user.id,
        status: Not('selesai'),
      },
      relations: ['nakes', 'pasien'],
    })

    if (transaksiBerjalan) {
      result.transaksiBerjalan = {
        ...transaksiBerjalan,
        nakes: {
          nama: transaksiBerjalan.nakes.nama,
          foto: transaksiBerjalan.nakes.foto,
        },
        pasien: {
          nama: transaksiBerjalan.pasien.nama,
          foto: transaksiBerjalan.pasien.foto,
        },
      }
    }

    type Filter = {
      nakesId?: string
      pasienId?: string
      berhasil?: boolean
    }

    const riwayatTransaksiFilter: Filter = {
      [whereId]: req.user.id,
    }

    if (berhasil === 'true') riwayatTransaksiFilter.berhasil = true
    if (berhasil === 'false') riwayatTransaksiFilter.berhasil = false

    const riwayatTransaksi = await RiwayatTransaksi.find({
      where: {
        ...riwayatTransaksiFilter,
      },
      take: limit as any,
      skip: limit && page && ((page as any) - 1) * (limit as any),
      order: {
        waktuDibuat: 'DESC',
      },
      relations: ['nakes', 'pasien'],
    })

    if (riwayatTransaksi && riwayatTransaksi[0]) {
      riwayatTransaksi.forEach((rtr) => {
        result.riwayatTransaksi.push({
          ...rtr,
          nakes: {
            nama: rtr.nakes.nama,
            foto: rtr.nakes.foto,
          },
          pasien: {
            nama: rtr.pasien.nama,
            foto: rtr.pasien.foto,
          },
        })
      })
    }

    let totalBelumSetor
    let totalTelahSetor
    let totalJasaTranspor

    if (user === 'nakes') {
      totalBelumSetor = await getRepository(RiwayatTransaksi)
        .createQueryBuilder('rtr')
        .select('SUM(rtr.biayaAdmin)', 'total')
        .where('rtr.nakesId = :nakesId', { nakesId: req.user.id })
        .andWhere('rtr.telahSetor = false')
        .andWhere('rtr.berhasil = true')
        .getRawOne()

      totalTelahSetor = await getRepository(RiwayatTransaksi)
        .createQueryBuilder('rtr')
        .select('SUM(rtr.biayaAdmin)', 'total')
        .where('rtr.nakesId = :nakesId', { nakesId: req.user.id })
        .andWhere('rtr.telahSetor = true')
        .andWhere('rtr.berhasil = true')
        .getRawOne()

      totalJasaTranspor = await getRepository(RiwayatTransaksi)
        .createQueryBuilder('rtr')
        .select('SUM(rtr.biayaTranspor)', 'transpor')
        .addSelect('SUM(rtr.biayaJasa)', 'jasa')
        .where('rtr.nakesId = :nakesId', { nakesId: req.user.id })
        .andWhere('rtr.berhasil = true')
        .getRawOne()
    }

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil transaksi',
      transaksiBerjalan: result.transaksiBerjalan,
      total: await RiwayatTransaksi.count({ where: { ...riwayatTransaksiFilter } }),
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      totalBelumSetor: user === 'nakes' ? parseFloat(totalBelumSetor.total) || 0 : undefined,
      totalTelahSetor: user === 'nakes' ? parseFloat(totalTelahSetor.total) || 0 : undefined,
      totalPendapatan:
        user === 'nakes'
          ? (parseFloat(totalJasaTranspor.jasa) || 0) -
            (parseFloat(totalBelumSetor.total) || 0) -
            (parseFloat(totalTelahSetor.total) || 0)
          : undefined,
      riwayatTransaksi: result.riwayatTransaksi,
    })
  } catch (err) {
    responseLogger(req.method, 500, req.baseUrl + req.path)
    res.json({
      success: false,
      message: err.message,
    })
  }
}

export const transaksiChatKirim = async (req: Request, res: Response) => {
  const transaksiId = req.params.transaksiId
  const { isi } = req.body

  const transaksi = await Transaksi.findOne(transaksiId)

  try {
    if (!transaksi) throw new Error('Transaksi tidak ditemukan')
    if (transaksi.pasienId !== req.user.id && transaksi.nakesId !== req.user.id)
      throw new Error('Akses tidak valid')
    if (!isi) throw new Error('Data tidak valid')

    const chat = new Chat()
    chat.transaksiId = transaksiId
    chat.pengirimId = req.user.id
    chat.isi = isi

    await Chat.save(chat)

    responseLogger(req.method, 201, req.baseUrl + req.path)
    res.status(201).json({
      success: true,
      message: 'Berhasil mengirim chat',
    })
  } catch (err) {
    let statusCode = 500

    if (err.message === 'Transaksi tidak ditemukan') statusCode = 404
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.mesasge === 'Data tidak valid') statusCode = 400

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const transaksiChatAmbil = async (req: Request, res: Response) => {
  const transaksiId = req.params.transaksiId

  try {
    const chat = await Chat.find({
      where: {
        transaksiId,
      },
      order: {
        waktuDibuat: 'ASC',
      },
    })

    const pengirimIds = await getRepository(Chat)
      .createQueryBuilder('chat')
      .select('chat.pengirimId', 'id')
      .distinct(true)
      .where('chat.transaksiId = :transaksiId', { transaksiId })
      .getRawMany()

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil chat transaksi',
      chat,
    })
  } catch (err) {
    let statusCode = 500

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}
