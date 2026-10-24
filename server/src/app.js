import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requireUser } from './services/supabaseServer.js'
import resumeRoutes from './routes/resumes.js'
import applicationRoutes from './routes/applications.js'

export const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin, methods: ['GET', 'POST', 'PUT'], credentials: false }))
app.use(express.json({ limit: '200kb' }))

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'resumate-api', timestamp: new Date().toISOString() })
})
app.use('/api/resumes', requireUser, resumeRoutes)
app.use('/api/applications', requireUser, applicationRoutes)

app.use(notFoundHandler)
app.use(errorHandler)
