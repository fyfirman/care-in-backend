import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { validate } from 'class-validator'

import { Pasien } from '../entity/Pasien'

import validationDescriber from '../util/validationDescriber'
import upcaseWordsFirstLetter from '../util/upcaseWordsFirstLetter'
import phoneNumberFormat from '../util/phoneNumberFormat'

export const create = async (req: Request, res: Response) => {
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
  } = req.body

  const pasien = new Pasien()

  // If noTelp OR email OR username already exist
  // it will sent through response.constraints with the message
  const existProperties = []

  try {
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
    pasien.beratBadan = beratBadan
    pasien.tinggiBadan = tinggiBadan
    pasien.goldar = goldar.toUpperCase()
    pasien.tempatLahir = tempatLahir

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

    await pasienRepo.save(pasien)

    res.status(201).json({ success: true, message: 'Berhasil membuat akun', pasien })
  } catch (err) {
    const constraints = validationDescriber(await validate(pasien))
    res.status(400).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const getOne = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const id = req.params.id

  try {
    const pasien = await pasienRepo.findOne(id)
    pasien.password = undefined

    if (!pasien) throw new Error('User tidak ditemukan')
    if (req.user.id !== id) throw new Error('Akses tidak valid')

    res.json({
      succes: true,
      message: 'Berhasil mengambil data profil',
      pasien,
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      message: 'Berhasil memperbarui profil',
    })
  } catch (err) {
    console.error(err)
    const constraints = validationDescriber(await validate(pasien))
    res.status(400).json({
      success: false,
      message: err.message,
      constraints: [...existProperties, ...constraints],
    })
  }
}

export const updateFoto = async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      message: 'Berhasil upload foto profil',
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    })
  }
}
