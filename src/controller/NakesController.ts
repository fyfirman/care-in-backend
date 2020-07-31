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

export const createNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const { jenis, nama, harga, username, password, email, noTelp, berbagiLokasi, lokasi } = req.body

  const foto = req.file

  const isChecking = req.query.hasOwnProperty('check')

  const nakes = new Nakes()

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  try {
    if (!password || password.length < 8)
      throw new Error('Password harus lebih atau sama dengan 8 karakter')

    const salt = await bcrypt.genSalt(10)

    nakes.nama = nama
    nakes.jenis = jenis
    nakes.harga = parseFloat(harga)
    nakes.username = username
    nakes.password = await bcrypt.hash(password, salt)
    nakes.email = email
    nakes.noTelp = phoneNumberFormat(noTelp)
    if (typeof berbagiLokasi === 'boolean') nakes.berbagiLokasi = berbagiLokasi
    if (foto) nakes.foto = '/public/upload/foto/' + foto.filename

    if (lokasi) nakes.lokasi = `POINT(${lokasi.lat} ${lokasi.lng})`
    else nakes.lokasi = 'POINT(0 0)'

    // Select user with noTelp OR email OR username from request body
    const nakesIsExist = await nakesRepo.find({
      where: [{ noTelp: phoneNumberFormat(noTelp) }, { email }, { username }],
    })
    // If there a user,
    // push an object to existProperties (if property value === request body)
    if (nakesIsExist.length > 0) {
      nakesIsExist.forEach((pas) => {
        pas.noTelp === phoneNumberFormat(noTelp) &&
          existProperties.push({
            property: 'noTelp',
            errors: ['nomor telepon sudah terdaftar'],
          })
        pas.email === email &&
          existProperties.push({
            property: 'email',
            errors: ['email sudah terdaftar'],
          })
        pas.username === username &&
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
    const constraints = validationDescriber(await validate(nakes))
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
    nakes.password = undefined

    if (!nakes) throw new Error('Nakes tidak ditemukan')

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
    const nakes = await nakesRepo.find({
      where: filter,
      order: findOrder,
      take: !origin && (limit as any),
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
        dataNakes.push({
          ...nakes,
          password: undefined,
          jarak: {
            nilai: jarakNakes.data.rows[0].elements[i].distance.value,
            teks: jarakNakes.data.rows[0].elements[i].distance.text,
          },
        })
      })
    } else {
      nakes.forEach((nakes) => {
        let jarakNilai = parseInt(getDistance(pointFormat(origin), nakes.lokasi) + '')
        let jarakTeks =
          jarakNilai < 1000
            ? '~' + jarakNilai.toFixed(0) + ' m'
            : '~' + (jarakNilai / 1000).toFixed(1) + ' km'
        dataNakes.push({
          ...nakes,
          password: undefined,
          jarak: {
            nilai: jarakNilai,
            teks: jarakTeks,
          },
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
      total: await nakesRepo.count({ where: filter }),
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

  const { jenis, nama, harga, username, password, email, noTelp, berbagiLokasi, lokasi } = req.body

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  const nakes = await nakesRepo.findOne(id)

  try {
    if (!nakes) throw new Error('Nakes tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    const salt = await bcrypt.genSalt(10)

    if (nama) nakes.nama = nama
    if (jenis) nakes.jenis = jenis
    if (harga) nakes.harga = parseFloat(harga)
    if (noTelp) nakes.noTelp = phoneNumberFormat(noTelp)
    if (email) nakes.email = email
    if (username) nakes.username = username
    if (password) nakes.password = await bcrypt.hash(password, salt)
    if (typeof berbagiLokasi === 'boolean') nakes.berbagiLokasi = berbagiLokasi
    if (lokasi) nakes.lokasi = `POINT(${lokasi.lat} ${lokasi.lng})`

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
          pas.noTelp === phoneNumberFormat(noTelp) &&
            existProperties.push({
              property: 'noTelp',
              errors: ['nomor telepon sudah terdaftar'],
            })
          pas.email === email &&
            existProperties.push({
              property: 'email',
              errors: ['email sudah terdaftar'],
            })
          pas.username === username &&
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
    const constraints = validationDescriber(await validate(nakes))

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
