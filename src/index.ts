import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as dotenv from 'dotenv'
import * as express from 'express'
import { Application } from 'express'

dotenv.config()

createConnection()
  .then(async (conn) => {
    console.log(`Connected to database: ${conn.options.database}`)

    const PORT = process.env.PORT || 5000

    const app: Application = express()
    app.use(express.json())

    // Run express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} ...\n`)
    })
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
