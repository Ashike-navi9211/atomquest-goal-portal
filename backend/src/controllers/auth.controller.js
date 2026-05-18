const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { ROLES } = require('../config/constants')

// POST /api/auth/register
// for hackathon demo — admin creates users or we seed them
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, reportsTo } = req.body

    // check if email already exists
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // validate role
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      })
    }

    // if reportsTo provided, verify that manager exists
    if (reportsTo) {
      const manager = await User.findById(reportsTo)
      if (!manager || manager.role !== ROLES.MANAGER) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager reference'
        })
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.EMPLOYEE,
      department: department || '',
      reportsTo: reportsTo || null
    })

    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        reportsTo: user.reportsTo,
        token
      }
    })

  } catch (err) {
    // handle mongoose validation errors cleanly
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      })
    }

    res.status(500).json({
      success: false,
      message: 'Register failed: ' + err.message
    })
  }
}


// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // explicitly select password since it's select:false in schema
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact your admin.'
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const token = generateToken(user._id, user.role)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        reportsTo: user.reportsTo,
        token
      }
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + err.message
    })
  }
}


// GET /api/auth/me
// returns logged in user info — frontend uses this on app load
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'reportsTo',
      'name email role department'
    )

    res.json({
      success: true,
      data: user
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user: ' + err.message
    })
  }
}


// GET /api/auth/managers
// used in register form and admin panel to pick a manager
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({
      role: ROLES.MANAGER,
      isActive: true
    }).select('name email department')

    res.json({
      success: true,
      data: managers
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers: ' + err.message
    })
  }
}


module.exports = { register, login, getMe, getManagers }
