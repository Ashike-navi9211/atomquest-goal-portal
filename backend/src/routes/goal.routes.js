const express = require('express')
const router = express.Router()

const {
  getMySheet,
  initSheet,
  addGoal,
  updateGoal,
  removeGoal,
  submitSheet,
  getTeamSheets,
  getSheetById,
  approveSheet,
  returnSheet,
  managerEditGoal,
  unlockSheet
} = require('../controllers/goal.controller')

const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

// employee routes
router.get('/my-sheet', protect, requireRole('employee'), getMySheet)
router.post('/init-sheet', protect, requireRole('employee'), initSheet)
router.post('/add-goal', protect, requireRole('employee'), addGoal)
router.put('/update-goal/:goalId', protect, requireRole('employee'), updateGoal)
router.delete('/remove-goal/:goalId', protect, requireRole('employee'), removeGoal)
router.post('/submit', protect, requireRole('employee'), submitSheet)

// manager routes
router.get('/team-sheets', protect, requireRole('manager'), getTeamSheets)
router.get('/sheet/:sheetId', protect, requireRole('manager', 'admin'), getSheetById)
router.put('/approve/:sheetId', protect, requireRole('manager'), approveSheet)
router.put('/return/:sheetId', protect, requireRole('manager'), returnSheet)
router.put('/manager-edit/:sheetId/:goalId', protect, requireRole('manager'), managerEditGoal)

// admin routes
router.put('/unlock/:sheetId', protect, requireRole('admin'), unlockSheet)

module.exports = router
