import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { validate } from 'class-validator'

import { Pasien } from '../entity/Pasien'

import validationDescriber from '../util/validationDescriber'
import upcaseWordsFirstLetter from '../util/upcaseWordsFirstLetter'
import phoneNumberFormat from '../util/phoneNumberFormat'
import { RiwayatKesehatan } from '../entity/RiwayatKesehatan'
import responseLogger from '../util/responseLogger'

export const createPasien = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const {
    nama,
    tglLahir,
    jk,
    noTelp,
    email,
    username,
    password,
    beratBadan,
    tinggiBadan,
    goldar,
    tempatLahir,
    riwayatKesehatan,
  } = req.body

  const isChecking = req.query.hasOwnProperty('check')

  const pasien = new Pasien()

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  try {
    if (riwayatKesehatan && riwayatKesehatan.length > 0) {
      riwayatKesehatan.forEach((rk) => {
        const tanggal = new Date(rk.tanggal)
        if (isNaN(tanggal.getTime())) throw new Error('tanggal riwayat kesehatan tidak valid')
        if (!rk.namaPenyakit) throw new Error('nama penyakit riwayat kesehatan harus diisi')
      })
    }

    if (!password || password.length < 8)
      throw new Error('Password harus lebih atau sama dengan 8 karakter')

    const salt = await bcrypt.genSalt(10)

    pasien.nama = upcaseWordsFirstLetter(nama)
    pasien.tglLahir = new Date(tglLahir)
    pasien.jk = jk.toUpperCase()
    pasien.noTelp = phoneNumberFormat(noTelp)
    pasien.email = email
    pasien.username = username
    pasien.password = await bcrypt.hash(password, salt)
    if (beratBadan) pasien.beratBadan = beratBadan
    if (tinggiBadan) pasien.tinggiBadan = tinggiBadan
    if (goldar) pasien.goldar = goldar.toUpperCase()
    if (tempatLahir) pasien.tempatLahir = tempatLahir

    // Select user with noTelp OR email OR username from request body
    const pasienIsExist = await pasienRepo.find({
      where: [{ noTelp: phoneNumberFormat(noTelp) }, { email }, { username }],
    })
    // If there a user,
    // push an object to existProperties (if property value === request body)
    if (pasienIsExist.length > 0) {
      pasienIsExist.forEach((pas) => {
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

      throw new Error('User sudah terdaftar')
    }

    const errors = await validate(pasien)
    if (errors.length > 0) throw new Error('Data registrasi tidak valid')

    if (!isChecking) {
      const savedPasien = await pasienRepo.save(pasien)

      if (riwayatKesehatan && riwayatKesehatan.length > 0)
        riwayatKesehatan.forEach(async (rk) => {
          const riwayat = new RiwayatKesehatan()

          riwayat.pasienId = savedPasien.id
          riwayat.tanggal = new Date(rk.tanggal)
          riwayat.namaPenyakit = rk.namaPenyakit

          await riwayat.save()
        })
    }

    responseLogger(req.method, !isChecking ? 201 : 200, req.baseUrl + req.path)
    res.status(!isChecking ? 201 : 200).json({
      success: true,
      message: !isChecking ? 'Berhasil membuat akun' : undefined,
    })
  } catch (err) {
    const constraints = validationDescriber(await validate(pasien))
    responseLogger(req.method, 400, req.baseUrl + req.path, err.message)
    res.status(400).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const getOnePasien = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const id = req.params.id

  try {
    const pasien = await pasienRepo.findOne(id)

    if (!pasien) throw new Error('User tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    pasien.password = undefined

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      succes: true,
      message: 'Berhasil mengambil data profil',
      pasien,
    })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'User tidak ditemukan') statusCode = 404

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(400).json({ success: false, message: err.message })
  }
}

export const updatePasienProfile = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const id = req.params.id

  const {
    nama,
    tglLahir,
    jk,
    noTelp,
    email,
    username,
    password,
    beratBadan,
    tinggiBadan,
    goldar,
    tempatLahir,
  } = req.body

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  const pasien = await pasienRepo.findOne(id)

  try {
    if (!pasien) throw new Error('User tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    const salt = await bcrypt.genSalt(10)

    if (nama) pasien.nama = upcaseWordsFirstLetter(nama)
    if (tglLahir) pasien.tglLahir = new Date(tglLahir)
    if (jk) pasien.jk = jk.toUpperCase()
    if (noTelp) pasien.noTelp = phoneNumberFormat(noTelp)
    if (email) pasien.email = email
    if (username) pasien.username = username
    if (password) pasien.password = await bcrypt.hash(password, salt)
    if (beratBadan) pasien.beratBadan = beratBadan
    if (tinggiBadan) pasien.tinggiBadan = tinggiBadan
    if (goldar) pasien.goldar = goldar.toUpperCase()
    if (tempatLahir) pasien.tempatLahir = tempatLahir

    // Select user with noTelp OR email OR username from request body
    const pasienIsExist = await pasienRepo.find({
      where: [{ noTelp: pasien.noTelp }, { email: pasien.email }, { username: pasien.username }],
    })
    // If there a user,
    // push an object to existProperties (if property value === request body)
    if (pasienIsExist.length > 0) {
      pasienIsExist
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
      if (pasienIsExist.filter((pas) => pas.id !== id).length > 0) throw new Error('Duplikasi data')
    }

    const errors = await validate(pasien)
    if (errors.length > 0) throw new Error('Data tidak valid')

    await pasienRepo.save(pasien)

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil memperbarui profil',
    })
  } catch (err) {
    let constraints = []
    if (pasien) constraints = validationDescriber(await validate(pasien))
    responseLogger(req.method, 400, req.baseUrl + req.path, err.message)
    res.status(400).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const updatePasienFoto = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const id = req.params.id
  const file = req.file

  try {
    if (!file) throw new Error('Tidak ada file')

    const pasien = await pasienRepo.findOne(id)

    if (!pasien) throw new Error('User tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    pasien.foto = '/public/upload/foto/' + file.filename

    await pasienRepo.save(pasien)

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil upload foto profil',
    })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'User tidak ditemukan') statusCode = 404
    if (err.message === 'Tidak ada file') statusCode = 404

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({
      success: false,
      message: err.message,
    })
  }
}

export const deleteOnePasien = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const id = req.params.id

  try {
    const pasien = await pasienRepo.findOne(id)

    if (!pasien) throw new Error('Pasien tidak ditemukan')
    if (id !== req.user.id) throw new Error('Akses tidak valid')

    await pasienRepo.remove(pasien)

    responseLogger(req.method, 202, req.baseUrl + req.path)
    res.status(202).json({ success: true, message: 'Berhasil menghapus pasien' })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Pasien tidak ditemukan') statusCode = 404
    if (err.message === 'Akses tidak valid') statusCode = 403

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}
