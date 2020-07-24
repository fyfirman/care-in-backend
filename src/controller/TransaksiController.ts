import { Request, Response } from 'express'
import { Transaksi } from '../entity/Transaksi'
import responseLogger from '../util/responseLogger'
import { Nakes } from '../entity/Nakes'
import { RiwayatTransaksi } from '../entity/RiwayatTransaksi'
import { RiwayatKesehatan } from '../entity/RiwayatKesehatan'
import { Not } from 'typeorm'

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
    if (!jarak || !pasienLokasi) throw new Error('Data tidak lengkap')

    const transaksiBerjalan = await Transaksi.findOne({
      where: [
        {
          pasienId,
          status: 'pending',
        },
        {
          pasienId,
          status: 'berjalan',
        },
      ],
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

    if (status) updateState.status = status
    if (berhasil === true) updateState.berhasil = true
    if (berhasil === false) updateState.berhasil = false

    await Transaksi.update(
      { id: transaksiId },
      {
        status: updateState.status,
        berhasil: updateState.berhasil,
      },
    )

    if (updateState.berhasil) {
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

      let biayaAwalTranspor = parseInt(process.env.TRANSPORT_PER_KM_PRICE)
      if (!biayaTranspor) {
        let biayaTransporStr = ((transaksi.meter / 1000) * biayaAwalTranspor).toFixed(0)
        if (biayaTransporStr.length > 3) {
          biayaTransporStr = biayaTransporStr.slice(0, -3) + '000'
          biayaTranspor = parseInt(biayaTransporStr)
          if (biayaTranspor < biayaAwalTranspor) biayaTranspor = biayaAwalTranspor
        } else biayaTranspor = biayaAwalTranspor
      } else biayaTranspor = parseInt(biayaTranspor)

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

      await RiwayatTransaksi.save(riwayatTransaksi)

      if (!isExist && sakit) {
        const riwayatKesehatan = new RiwayatKesehatan()

        riwayatKesehatan.pasienId = transaksi.pasienId
        riwayatKesehatan.namaPenyakit = namaPenyakit
        riwayatKesehatan.tanggal = new Date()

        await RiwayatKesehatan.save(riwayatKesehatan)
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
    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const getRiwayatTransaksi = async (req: Request, res: Response) => {
  const { limit, page } = req.query

  try {
    const transaksiBerjalan = await Transaksi.findOne({
      where: {
        pasienId: req.user.id,
        status: Not('selesai'),
      },
    })

    const riwayatTransaksi = await RiwayatTransaksi.find({
      where: { pasienId: req.user.id },
      take: limit as any,
      skip: limit && page && ((page as any) - 1) * (limit as any),
      order: {
        waktuDibuat: 'DESC',
      },
    })

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil transaksi',
      transaksiBerjalan,
      total: await RiwayatTransaksi.count(),
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      riwayatTransaksi,
    })
  } catch (err) {
    responseLogger(req.method, 500, req.baseUrl + req.path)
    res.json({
      success: false,
      message: err.message,
    })
  }
}
