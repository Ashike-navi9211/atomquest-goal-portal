const express = require('express')
const router = express.Router()

const {
  submitCheckin,
  updateCheckin,
  getMyCheckins,
  getTeamCheckins,
  getSheetCheckins,
  addManagerComment
} = require('../controllers/checkin.controller')

const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

// employee routes
router.post('/submit', protect, requireRole('employee'), submitCheckin)
router.put('/update/:checkinId', protect, requireRole('employee'), updateCheckin)
router.get('/my-checkins', protect, requireRole('employee'), getMyCheckins)

// manager routes
router.get('/team-checkins', protect, requireRole('manager'), getTeamCheckins)
router.get('/sheet-checkins/:sheetId', protect, requireRole('manager', 'admin'), getSheetCheckins)
router.put('/comment/:checkinId', protect, requireRole('manager'), addManagerComment)

module.exports = router
