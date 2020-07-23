import { appendFile } from 'fs'

const monthName = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export default (method, statusCode, route, message = 'Sukses') => {
  const now = new Date()
  const hour = now.getHours() < 10 ? `0${now.getHours()}` : now.getHours()
  const minute = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes()
  const second = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds()

  const date = `${now.getDate()} ${monthName[now.getMonth()]} ${now.getFullYear()}`
  const time = `${hour}:${minute}:${second}`

  const log = `${date} ${time} ${method} ${statusCode} ${route}\nKeterangan: ${message}\n`

  let line = ''
  for (let i = 0; i < 110; i++) {
    line += '-'
  }

  appendFile(__dirname + '../../../response.log', log + line + '\n', () => {
    console.log(log + line)
  })
}
