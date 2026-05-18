const express = require('express')
const router = express.Router()

const {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  getAllSheets,
  getCompletionStats,
  getAuditLogs,
  getDepartments,
  getEmployees
} = require('../controllers/admin.controller')

const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

// all admin routes require admin role
router.use(protect, requireRole('admin'))

router.get('/users', getAllUsers)
router.post('/users', createUser)
router.put('/users/:userId', updateUser)
router.delete('/users/:userId', deactivateUser)

router.get('/all-sheets', getAllSheets)
router.get('/completion-stats', getCompletionStats)
router.get('/audit-logs', getAuditLogs)
router.get('/departments', getDepartments)
router.get('/employees', getEmployees)

module.exports = router
