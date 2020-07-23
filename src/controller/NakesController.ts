import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { validate } from 'class-validator'

import { Nakes } from '../entity/Nakes'

import validationDescriber from '../util/validationDescriber'
import phoneNumberFormat from '../util/phoneNumberFormat'
import responseLogger from '../util/responseLogger'

export const createNakes = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const { jenis, nama, harga, username, password, email, noTelp, berbagiLokasi } = req.body

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

  const { page, limit, jenis, berbagiLokasi, sort, order } = req.query

  const filter = {}
  if (jenis) filter['jenis'] = jenis
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

  try {
    const nakes = await nakesRepo.find({
      where: filter,
      take: limit as any,
      skip: limit && page && ((page as any) - 1) * (limit as any),
      order: sortBy,
    })

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil daftar nakes',
      total: await nakesRepo.count({ where: filter }),
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      nakes,
    })
  } catch (err) {
    responseLogger(req.method, 500, req.baseUrl + req.path, err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateNakesProfile = async (req: Request, res: Response) => {
  const nakesRepo = getRepository(Nakes)

  const id = req.params.id

  const { jenis, nama, harga, username, password, email, noTelp, berbagiLokasi } = req.body

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

    await nakesRepo.delete(nakes)

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
