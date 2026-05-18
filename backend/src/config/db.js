const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // these options avoid deprecation warnings in newer mongoose
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(`DB connection failed: ${err.message}`)
    // exit process if db fails — no point running server without db
    process.exit(1)
  }
}

module.exports = connectDB
