const User = require('../models/User')
const GoalSheet = require('../models/GoalSheet')
const CheckIn = require('../models/CheckIn')
const AuditLog = require('../models/AuditLog')
const { ROLES } = require('../config/constants')


// GET /api/admin/users
// get all users with optional role filter
const getAllUsers = async (req, res) => {
  try {
    const { role, department } = req.query

    const query = {}
    if (role) query.role = role
    if (department) query.department = department

    const users = await User.find(query)
      .populate('reportsTo', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: users })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users: ' + err.message
    })
  }
}


// POST /api/admin/users
// admin creates a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, reportsTo } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

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
      password: password || 'atomquest@123',  // default password for demo
      role: role || ROLES.EMPLOYEE,
      department: department || '',
      reportsTo: reportsTo || null
    })

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        reportsTo: user.reportsTo
      }
    })

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, message: messages.join(', ') })
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create user: ' + err.message
    })
  }
}


// PUT /api/admin/users/:userId
// admin updates user details
const updateUser = async (req, res) => {
  try {
    const { name, department, reportsTo, role, isActive } = req.body
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (name) user.name = name
    if (department !== undefined) user.department = department
    if (role) user.role = role
    if (isActive !== undefined) user.isActive = isActive

    if (reportsTo !== undefined) {
      if (reportsTo === null) {
        user.reportsTo = null
      } else {
        const manager = await User.findById(reportsTo)
        if (!manager || manager.role !== ROLES.MANAGER) {
          return res.status(400).json({
            success: false,
            message: 'Invalid manager reference'
          })
        }
        user.reportsTo = reportsTo
      }
    }

    await user.save()

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user: ' + err.message
    })
  }
}


// DELETE /api/admin/users/:userId
// soft delete — just deactivates the user
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      })
    }

    user.isActive = false
    await user.save()

    res.json({
      success: true,
      message: 'User deactivated successfully'
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user: ' + err.message
    })
  }
}


// GET /api/admin/all-sheets
// admin views all goal sheets across all employees
const getAllSheets = async (req, res) => {
  try {
    const cycleYear = req.query.year || new Date().getFullYear()
    const { status, department } = req.query

    let query = { cycleYear: parseInt(cycleYear) }
    if (status) query.status = status

    let sheets = await GoalSheet.find(query)
      .populate('employee', 'name email department')
      .populate('manager', 'name email')
      .sort({ updatedAt: -1 })

    // filter by department if provided
    if (department) {
      sheets = sheets.filter(
        s => s.employee && s.employee.department === department
      )
    }

    res.json({ success: true, data: sheets })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sheets: ' + err.message
    })
  }
}


// GET /api/admin/completion-stats
// real-time completion dashboard — BRD section 4
const getCompletionStats = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { quarter } = req.query

    const totalEmployees = await User.countDocuments({
      role: ROLES.EMPLOYEE,
      isActive: true
    })

    const totalManagers = await User.countDocuments({
      role: ROLES.MANAGER,
      isActive: true
    })

    // how many employees have submitted their sheet
    const submittedSheets = await GoalSheet.countDocuments({
      cycleYear,
      status: { $in: ['submitted', 'approved'] }
    })

    // how many sheets are approved
    const approvedSheets = await GoalSheet.countDocuments({
      cycleYear,
      status: 'approved'
    })

    // how many employees have no sheet at all
    const sheetsCreated = await GoalSheet.countDocuments({ cycleYear })

    // checkin stats for the requested quarter
    let checkinStats = null
    if (quarter) {
      const totalCheckins = await CheckIn.countDocuments({
        cycleYear,
        quarter
      })

      const managerCommented = await CheckIn.countDocuments({
        cycleYear,
        quarter,
        managerComment: { $ne: '' }
      })

      checkinStats = {
        quarter,
        employeesCheckedIn: totalCheckins,
        managersCommented: managerCommented
      }
    }

    res.json({
      success: true,
      data: {
        cycleYear,
        totalEmployees,
        totalManagers,
        sheetsCreated,
        submittedSheets,
        approvedSheets,
        pendingApproval: submittedSheets - approvedSheets,
        notSubmitted: totalEmployees - submittedSheets,
        checkinStats
      }
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats: ' + err.message
    })
  }
}


// GET /api/admin/audit-logs
// admin views full audit trail — BRD section 4
const getAuditLogs = async (req, res) => {
  try {
    const { action, employeeId, from, to } = req.query

    const query = {}
    if (action) query.action = action
    if (employeeId) query.employee = employeeId

    // date range filter
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    const logs = await AuditLog.find(query)
      .populate('changedBy', 'name email role')
      .populate('employee', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)  // reasonable limit for demo

    res.json({ success: true, data: logs })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs: ' + err.message
    })
  }
}


// GET /api/admin/departments
// returns list of unique departments for filter dropdowns
const getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', {
      isActive: true,
      department: { $ne: '' }
    })

    res.json({ success: true, data: departments })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments: ' + err.message
    })
  }
}


// GET /api/admin/employees
// returns all active employees — used in shared goal recipient picker
const getEmployees = async (req, res) => {
  try {
    const { department } = req.query

    const query = { role: ROLES.EMPLOYEE, isActive: true }
    if (department) query.department = department

    const employees = await User.find(query)
      .populate('reportsTo', 'name')
      .select('name email department reportsTo')
      .sort({ name: 1 })

    res.json({ success: true, data: employees })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees: ' + err.message
    })
  }
}


module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  getAllSheets,
  getCompletionStats,
  getAuditLogs,
  getDepartments,
  getEmployees
}
