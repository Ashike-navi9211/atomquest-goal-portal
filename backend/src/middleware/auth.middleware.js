const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    let token

    // check authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      })
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // attach user to request (without password)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact admin.'
      })
    }

    req.user = user
    next()

  } catch (err) {
    // handle expired or malformed tokens cleanly
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Auth error: ' + err.message
    })
  }
}

module.exports = { protect }
