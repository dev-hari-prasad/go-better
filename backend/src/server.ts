import express from 'express'
import { log } from 'node:console'

import './config/env.ts'

//Import routes
import webHookReciver from './routes/webHookReciver.routes.ts'

// Start background workers
import './workers/index.ts'

// Inti app and declare port
const app = express()
const port = process.env.PORT || 5000 || 5654 || 8744

//Body json parsing
app.use(express.json())


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Hello from localhost"
    })
})

//Routes
app.use('/webhook', webHookReciver)


app.use((req, res)=> {
    res.status(404).json({
        "error": "not found"
    })
})

// Create server instance
app.listen(port, () => {
    log(`Server started at: https://localhost:${port}`)
})