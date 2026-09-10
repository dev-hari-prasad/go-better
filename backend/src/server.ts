import express from 'express'
import { log } from 'node:console'
import cors from "cors";
import cookieParser from 'cookie-parser';

import './config/env.ts'

//Import routes index
import {
  webHookReciver,
  byokRouter,
  usersRouter,
  pullRequestRouter,
  conversationRouter,
  reviewRouter,
  workspaceRouter,
  usageRouter,
  authRouter
} from './routes/index.ts'

// Start background workers
import './workers/index.ts'

// Middlewears
import { authMiddleware } from './middleware/index.ts'; //Internal party
import useragent from 'express-useragent'; // Thrid party

// Inti app and declare port
const app = express()
const port = process.env.PORT || 5000 || 5654 || 8744

//Body json parsing
app.use(express.json()) // Internal
app.use(cookieParser()) // Thrid part

// Invalid JSON handler
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON",
      message: "The request body contains malformed JSON."
    });
  }

  next(err);
});

//User agent middlewear for useragent parsing 
app.use(useragent.express())

// CORS allow
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "ok"
    })
})

//Routes
app.use('/webhook', authMiddleware, webHookReciver)
app.use('/byok', authMiddleware, byokRouter)
app.use('/users', authMiddleware, usersRouter)
app.use('/pull-request', authMiddleware, pullRequestRouter)
app.use('/conversation', authMiddleware, conversationRouter)
app.use('/review', authMiddleware, reviewRouter)
app.use('/workspace', authMiddleware, workspaceRouter)
app.use('/usage', authMiddleware, usageRouter)
app.use('/auth', authRouter)

// Handle not found routes
app.use((req, res) => {
    res.status(404).json({
        "error": "not found"
    })
})

// Create server instance
app.listen(port, () => {
    log(`Server started at: https://localhost:${port}`)
})