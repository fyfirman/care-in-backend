import { Request, Response } from 'express'
import { getRepository, Like } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { validate } from 'class-validator'
import { Nakes } from '../entity/Nakes'
import validationDescriber from '../util/validationDescriber'
import phoneNumberFormat from '../util/phoneNumberFormat'
import responseLogger from '../util/responseLogger'
import pointFormat from '../util/pointFormat'
import Axios from 'axios'
import calcBiayaTranspor from '../util/calcBiayaTranspor'

enum Jenis {
  dokter = 'dokter',
  nakes = 'nakes',
  psikolog = 'psikolog',
}

type Lokasi = {
  lat: number
  lng: number
}

interface Body {
  nama: string
  harga: number
  username: string
  password: string
  email: string
  noTelp: string
  berbagiLokasi: boolean
  lokasi: Lokasi
  jenis: Jenis
}

export const createNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const body: Body = req.body

  const foto = req.file

  const isChecking = req.query.hasOwnProperty('check')

  const nakes = new Nakes()

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  try {
    let jenisIsValid = false
    for (let j in Jenis) {
      if (body.jenis === j) jenisIsValid = true
    }
    if (!jenisIsValid) throw new Error('Jenis tidak valid')

    if (!body.password || body.password.length < 8)
      throw new Error('Password harus lebih atau sama dengan 8 karakter')

    const salt = await bcrypt.genSalt(10)

    nakes.nama = body.nama
    nakes.jenis = body.jenis
    nakes.harga = body.harga
    nakes.username = body.username
    nakes.password = await bcrypt.hash(body.password, salt)
    nakes.email = body.email
    nakes.noTelp = phoneNumberFormat(body.noTelp)
    if (typeof body.berbagiLokasi === 'boolean') nakes.berbagiLokasi = body.berbagiLokasi
    if (foto) nakes.foto = '/public/upload/foto/' + foto.filename

    if (body.lokasi.lat < -90 || body.lokasi.lat > 90) throw new Error('Lokasi tidak valid')
    if (body.lokasi.lng < -180 || body.lokasi.lng > 180) throw new Error('Lokasi tidak valid')

    if (body.lokasi) nakes.lokasi = `POINT(${body.lokasi.lat} ${body.lokasi.lng})`
    else nakes.lokasi = 'POINT(0 0)'

    // Select user with noTelp OR email OR username from request body
    const nakesIsExist = await nakesRepo.find({
      where: [
        { noTelp: phoneNumberFormat(body.noTelp) },
        { email: body.email },
        { username: body.username },
      ],
    })
    // If there a user,
    // push an object to existProperties (if property value === request body)
    if (nakesIsExist.length > 0) {
      nakesIsExist.forEach((pas) => {
        pas.noTelp === phoneNumberFormat(body.noTelp) &&
          existProperties.push({
            property: 'noTelp',
            errors: ['nomor telepon sudah terdaftar'],
          })
        pas.email === body.email &&
          existProperties.push({
            property: 'email',
            errors: ['email sudah terdaftar'],
          })
        pas.username === body.username &&
          existProperties.push({
            property: 'username',
            errors: ['username sudah terdaftar'],
          })
      })

      throw new Error('Nakes sudah terdaftar')
    }

    const errors = await validate(nakes)
    if (errors.length > 0) throw new Error('Data registrasi tidak valid')

    if (!isChecking) await nakesRepo.save(nakes)

    let statusCode = !isChecking ? 201 : 200

    responseLogger(req.method, statusCode, req.baseUrl + req.path)
    res.status(statusCode).json({
      success: true,
      message: !isChecking ? 'Berhasil membuat akun' : undefined,
    })
  } catch (err) {
    const constraints = nakes && validationDescriber(await validate(nakes))
    responseLogger(req.method, 400, req.baseUrl + req.path, err.message)
    res.status(400).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const getOneNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const id = req.params.id

  try {
    const nakes = await nakesRepo.findOne(id)

    if (!nakes) throw new Error('Nakes tidak ditemukan')

    nakes.password = undefined

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      succes: true,
      message: 'Berhasil mengambil data nakes',
      nakes,
    })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Nakes tidak ditemukan') statusCode = 404

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}

export const getManyNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const { origin, page, limit, jenis, berbagiLokasi, sort, order, nama, id } = req.query

  const filter = {}
  if (jenis) filter['jenis'] = jenis
  if (nama) filter['nama'] = Like(`%${nama}%`)
  if (id) filter['id'] = id
  if (berbagiLokasi == 'true') filter['berbagiLokasi'] = true
  if (berbagiLokasi == 'false') filter['berbagiLokasi'] = false

  const sortBy = {}
  if (sort && order) {
    if (Array.isArray(sort) && Array.isArray(order) && sort.length === order.length) {
      for (let i = 0; i < sort.length; i++) {
        sortBy[sort[i] as string] = (order[i] as string).toUpperCase()
      }
    } else if (!Array.isArray(sort) && !Array.isArray(order)) {
      sortBy[sort as string] = (order as string).toUpperCase()
    }
  }

  const findOrder = { ...sortBy }
  if (findOrder['jarak']) delete findOrder['jarak']

  try {
    if (!origin) {
      if ((limit as any) < 0 || (page as any) < 1)
        throw new Error('Paginasi error, nilai tidak valid')
    }

    const nakes = await nakesRepo.find({
      where: filter,
      order: findOrder,
      take: !origin ? (limit as any) : 25,
      skip: !origin && limit && page && ((page as any) - 1) * (limit as any),
    })

    if (!origin) {
      responseLogger(req.method, 200, req.baseUrl + req.path)
      return res.json({
        success: true,
        message: 'Berhasil mengambil daftar nakes',
        total: await nakesRepo.count({ where: filter }),
        limit: parseInt(limit as string) || 0,
        page: parseInt(page as string) || 0,
        nakes: nakes,
      })
    }

    const rad = (x) => {
      return (x * Math.PI) / 180
    }

    const getDistance = (p1, p2) => {
      let R = 6378137 // Earth’s mean radius in meter
      let dLat = rad(p2.lat - p1.lat)
      let dLong = rad(p2.lng - p1.lng)
      let a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2)
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      let distance = R * c
      return distance // returns the distance in meter
    }

    const getDestination = (nakes) => {
      let destination = ''
      nakes.forEach((nakes) => {
        destination += Object.values(nakes.lokasi).join(',') + '|'
      })
      return destination.slice(0, -1)
    }

    const googleDistanceMatrixAPI = 'https://maps.googleapis.com/maps/api/distancematrix/json'
    const parameters = {
      key: process.env.GOOGLE_API_KEY,
      origins: Object.values(pointFormat(origin)).join(','),
      destinations: getDestination(nakes),
    }
    const { key, origins, destinations } = parameters
    const requestURL = `${googleDistanceMatrixAPI}?origins=${origins}&destinations=${destinations}&key=${key}`
    const jarakNakes: any = await Axios.get(requestURL)

    const dataNakes = []
    if (jarakNakes.data.status === 'OK') {
      nakes.forEach((nakes, i) => {
        if (jarakNakes.data.rows[0].elements[i].distance) {
          let jarakNilai = jarakNakes.data.rows[0].elements[i].distance.value
          let jarakTeks = jarakNakes.data.rows[0].elements[i].distance.text
          let biayaTranspor = calcBiayaTranspor(jarakNilai)

          dataNakes.push({
            ...nakes,
            password: undefined,
            jarak: {
              nilai: jarakNilai,
              teks: jarakTeks,
            },
            biayaTranspor,
          })
        }
      })
    } else {
      nakes.forEach((nakes) => {
        let jarakNilai = parseInt(getDistance(pointFormat(origin), nakes.lokasi) + '')

        let jarakTeks =
          jarakNilai < 1000
            ? '~' + jarakNilai.toFixed(0) + ' m'
            : '~' + (jarakNilai / 1000).toFixed(1) + ' km'

        let biayaTranspor = calcBiayaTranspor(jarakNilai)

        dataNakes.push({
          ...nakes,
          password: undefined,
          jarak: {
            nilai: jarakNilai,
            teks: jarakTeks,
          },
          biayaTranspor,
        })
      })
    }

    const sortedByJarak = dataNakes.sort((a, b) => {
      if (sortBy.hasOwnProperty('jarak')) {
        if (sortBy['jarak'] === 'asc' || sortBy['jarak'] === 'ASC') {
          if (a.jarak.nilai < b.jarak.nilai) return -1
          if (a.jarak.nilai > b.jarak.nilai) return 1
        } else if (sortBy['jarak'] === 'desc' || sortBy['jarak'] === 'DESC') {
          if (a.jarak.nilai < b.jarak.nilai) return 1
          if (a.jarak.nilai > b.jarak.nilai) return -1
        }
      }
      return 0
    })

    const paginateArray = (array, pageSize, pageNumber) => {
      return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    }

    const nakesResult = limit && page ? paginateArray(sortedByJarak, limit, page) : sortedByJarak

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil daftar nakes',
      total: !origin ? await nakesRepo.count({ where: filter }) : nakesResult.length,
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      nakes: nakesResult,
    })
  } catch (err) {
    responseLogger(req.method, 500, req.baseUrl + req.path, err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateNakesProfile = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const id = req.params.id

  const body: Body = req.body
  // const { jenis, nama, harga, username, password, email, noTelp, berbagiLokasi, lokasi } = req.body

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  const nakes = await nakesRepo.findOne(id)

  try {
    if (!nakes) throw new Error('Nakes tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')
    let jenisIsValid = body.jenis ? false : true
    if (body.jenis) {
      for (let j in Jenis) {
        if (body.jenis === j) jenisIsValid = true
      }
    }
    if (!jenisIsValid) throw new Error('Jenis tidak valid')

    const salt = await bcrypt.genSalt(10)

    if (body.nama) nakes.nama = body.nama
    if (body.jenis) nakes.jenis = body.jenis
    if (body.harga) nakes.harga = body.harga
    if (body.noTelp) nakes.noTelp = phoneNumberFormat(body.noTelp)
    if (body.email) nakes.email = body.email
    if (body.username) nakes.username = body.username
    if (body.password) nakes.password = await bcrypt.hash(body.password, salt)
    if (typeof body.berbagiLokasi === 'boolean') nakes.berbagiLokasi = body.berbagiLokasi

    if (body.lokasi) {
      if (body.lokasi.lat < -90 || body.lokasi.lat > 90) throw new Error('Lokasi tidak valid')
      if (body.lokasi.lng < -180 || body.lokasi.lng > 180) throw new Error('Lokasi tidak valid')

      nakes.lokasi = `POINT(${body.lokasi.lat} ${body.lokasi.lng})`
    } else nakes.lokasi = `POINT(${nakes.lokasi['lat']} ${nakes.lokasi['lng']})`

    // Select user with noTelp OR email OR username from request body
    const nakesIsExist = await nakesRepo.find({
      where: [{ noTelp: nakes.noTelp }, { email: nakes.email }, { username: nakes.username }],
    })
    // If there a user,
    // push an object to existProperties (if property value === request body)
    if (nakesIsExist.length > 0) {
      nakesIsExist
        .filter((pas) => pas.id !== id)
        .forEach((pas) => {
          pas.noTelp === phoneNumberFormat(body.noTelp) &&
            existProperties.push({
              property: 'noTelp',
              errors: ['nomor telepon sudah terdaftar'],
            })
          pas.email === body.email &&
            existProperties.push({
              property: 'email',
              errors: ['email sudah terdaftar'],
            })
          pas.username === body.username &&
            existProperties.push({
              property: 'username',
              errors: ['username sudah terdaftar'],
            })
        })
      if (nakesIsExist.filter((pas) => pas.id !== id).length > 0) throw new Error('Duplikasi data')
    }

    const errors = await validate(nakes)
    if (errors.length > 0) throw new Error('Data tidak valid')

    await nakesRepo.save(nakes)

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil memperbarui profil',
    })
  } catch (err) {
    let constraints = []
    if (nakes) constraints = validationDescriber(await validate(nakes))

    let statusCode = 500
    if (err.message === 'Data tidak valid') statusCode = 400
    if (err.message === 'Duplikasi data') statusCode = 400
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'Nakes tidak ditemukan') statusCode = 404

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const updateNakesFoto = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const id = req.params.id
  const file = req.file

  try {
    if (!file) throw new Error('Tidak ada file')

    const nakes = await nakesRepo.findOne(id)

    if (!nakes) throw new Error('Nakes tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    nakes.foto = '/public/upload/foto/' + file.filename

    await nakesRepo.save(nakes)

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil upload foto profil',
    })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'Tidak ada file') statusCode = 404
    if (err.message === 'Nakes tidak ditemukan') statusCode = 404

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const deleteOneNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const id = req.params.id

  try {
    const nakes = await nakesRepo.findOne(id)

    if (!nakes) throw new Error('Nakes tidak ditemukan')
    if (id !== req.user.id) throw new Error('Akses tidak valid')

    await nakesRepo.remove(nakes)

    responseLogger(req.method, 202, req.baseUrl + req.path)
    res.status(202).json({ success: true, message: 'Berhasil menghapus nakes' })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Nakes tidak ditemukan') statusCode = 404
    if (err.message === 'Akses tidak valid') statusCode = 403

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}
