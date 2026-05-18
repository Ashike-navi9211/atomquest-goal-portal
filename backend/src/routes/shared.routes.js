const express = require('express')
const router = express.Router()

const {
  createAndPushSharedGoal,
  getAllSharedGoals,
  updateSharedGoalWeightage,
  syncAchievement
} = require('../controllers/shared.controller')

const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

// admin and manager can create and view shared goals
router.post('/create', protect, requireRole('admin', 'manager'), createAndPushSharedGoal)
router.get('/all', protect, requireRole('admin', 'manager'), getAllSharedGoals)

// employee adjusts weightage of their shared goal
router.put('/update-weightage/:sheetId/:goalId', protect, requireRole('employee'), updateSharedGoalWeightage)

// primary owner syncs achievement to all linked sheets
router.put('/sync-achievement/:sharedGoalId', protect, requireRole('employee'), syncAchievement)

module.exports = router
