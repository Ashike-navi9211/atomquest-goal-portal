const express = require('express')
const cors = require('cors')

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
]

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AtomQuest API is running'
  })
})

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/goals', require('./routes/goal.routes'))
app.use('/api/checkin', require('./routes/checkin.routes'))
app.use('/api/shared', require('./routes/shared.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/reports', require('./routes/report.routes'))

app.use((err, req, res, next) => {
  console.error(err.stack)

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

module.exports = app
