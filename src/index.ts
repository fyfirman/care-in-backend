import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as dotenv from 'dotenv'
import * as express from 'express'
import { Application } from 'express'
import { join } from 'path'
import * as http from 'http'
import * as socketio from 'socket.io'
import * as cors from 'cors'

// Importing routes
import PublicRoute from './route/PublicRoute'
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
    app.use(cors())

    // Serve express static folder
    app.use('/public', express.static(join(__dirname, '../public')))

    // Appliying routes
    app.use('/api/v1', PublicRoute)
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
    const io = socketio(server);
    const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
    
    io.on("connection", (socket) => {
      console.log(`Client ${socket.id} connected`);
    
      // Join a conversation
      const { roomId } = socket.handshake.query;
      socket.join(roomId);
    
      // Listen for new messages
      socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
        io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
      });
    
      // Leave the room if the user closes the socket
      socket.on("disconnect", () => {
        console.log(`Client ${socket.id} diconnected`);
        socket.leave(roomId);
      });
    });
    
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
