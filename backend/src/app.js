const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AtomQuest API is running' })
})

// routes
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/goals', require('./routes/goal.routes'))
app.use('/api/checkin', require('./routes/checkin.routes'))
app.use('/api/shared', require('./routes/shared.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/reports', require('./routes/report.routes'))

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

module.exports = app
