import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import { Pasien } from '../entity/Pasien'
import { Nakes } from '../entity/Nakes'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import responseLogger from '../util/responseLogger'

export const generateToken = async (req: Request, res: Response) => {
  const pasienRepo = getRepository(Pasien)
  const nakesRepo = getRepository(Nakes)

  const { login, remember } = req.query
  const { username, password } = req.body

  try {
    if (!username || !password) throw new Error('Data tidak lengkap')

    let user = undefined
    if (login === 'nakes') user = await nakesRepo.findOne({ where: { username } })
    else user = await pasienRepo.findOne({ where: { username } })

    if (!user) throw new Error('Username atau password salah')

    const isMatch = await compare(password, user.password.toString())
    if (!isMatch) throw new Error('Username atau password salah')

    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    }

    const token = sign(payload, process.env.JWT_SECRET, {
      expiresIn: remember === 'true' ? '30d' : '7d',
    })

    responseLogger(req.method, 200, req.baseUrl + req.path, 'Login berhasil')
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
    })
  } catch (err) {
    responseLogger(req.method, 400, req.baseUrl + req.path, err.message)
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

  responseLogger(req.method, 200, req.baseUrl + req.path, 'Token valid')
  res.json({
    success: true,
    message: 'Token valid',
    user: req.user,
    remaining: timeConversion(req.tokenExp - Date.now()),
  })
}
