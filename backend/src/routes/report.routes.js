const express = require('express')
const router = express.Router()

const {
  getAchievementReport,
  exportExcel,
  exportCSV,
  getManagerSummary
} = require('../controllers/report.controller')

const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

// admin and manager can access reports
router.get(
  '/achievement',
  protect,
  requireRole('admin', 'manager'),
  getAchievementReport
)

router.get(
  '/export-excel',
  protect,
  requireRole('admin', 'manager'),
  exportExcel
)

router.get(
  '/export-csv',
  protect,
  requireRole('admin', 'manager'),
  exportCSV
)

router.get(
  '/manager-summary',
  protect,
  requireRole('admin'),
  getManagerSummary
)

module.exports = router
