import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import { Pasien } from '../entity/Pasien'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export const generateToken = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)

  const { remember } = req.query
  const { username, password } = req.body

  try {
    if (!username || !password) throw new Error('Data tidak lengkap')

    const pasien = await pasienRepo.findOne({ where: { username } })
    if (!pasien) throw new Error('Username atau password salah')

    const isMatch = await compare(password, pasien.password.toString())
    if (!isMatch) throw new Error('Username atau password salah')

    const payload = {
      user: {
        id: pasien.id,
        username: pasien.username,
      },
    }

    const token = sign(payload, process.env.JWT_SECRET, {
      expiresIn: remember === 'true' ? '30d' : '7d',
    })

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export const checkToken = (req: Request, res: Response) => {
  const timeConversion = (millisec): string => {
    var seconds: number = millisec / 1000

    var minutes: number = millisec / (1000 * 60)

    var hours: number = millisec / (1000 * 60 * 60)

    var days: number = millisec / (1000 * 60 * 60 * 24)

    if (seconds < 60) return seconds.toFixed(0) + ' detik'
    if (minutes < 60) return minutes.toFixed(0) + ' menit'
    if (hours < 24) return hours.toFixed(0) + ' jam'
    return days.toFixed(0) + ' hari'
  }

  res.json({
    success: true,
    message: 'Token valid',
    user: req.user,
    remaining: timeConversion(req.tokenExp - Date.now()),
  })
}
