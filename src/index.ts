import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as dotenv from 'dotenv'
import * as express from 'express'
import { Application } from 'express'
import { join } from 'path'
import * as http from 'http'
import * as socketio from 'socket.io'

// Importing routes
import PasienRoute from './route/PasienRoute'
import AuthRoute from './route/AuthRoute'
import RiwayatKesehatanRoute from './route/RiwayatKesehatanRoute'
import NakesRoute from './route/NakesRoute'
import TransaksiRoute from './route/TransaksiRoute'

// Load .env file
dotenv.config({ path: '.env' })

createConnection()
  .then(async (conn) => {
    console.log(`Connected to database: ${conn.options.database}`)

    const PORT = process.env.PORT || 5000

    const app: Application = express()

    // Applying middlewares
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Serve express static folder
    app.use('/public', express.static(join(__dirname, '../public')))

    // Appliying routes
    app.use('/api/v1/pasien', PasienRoute)
    app.use('/api/v1/auth', AuthRoute)
    app.use('/api/v1/riwayat-kesehatan', RiwayatKesehatanRoute)
    app.use('/api/v1/nakes', NakesRoute)
    app.use('/api/v1/transaksi', TransaksiRoute)

    // Run express server
    const server = http.createServer(app)
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} ...\n`)
    })

    // socket io connection
    const io = socketio(server)
    io.on('connection', (socket) => {
      // user joins the channel
      // by emitting 'joinRoom'
      socket.on('joinRoom', (data) => {
        socket.join(data.transaksiId)
      })

      // user sends the chat
      socket.on('sendChat', (data) => {
        socket.to(data.transaksiId).emit('receiveChat', data)
      })
    })
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
