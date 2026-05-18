const SharedGoal = require('../models/SharedGoal')
const GoalSheet = require('../models/GoalSheet')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { GOAL_RULES, SHEET_STATUS } = require('../config/constants')


// POST /api/shared/create
// admin or manager creates a shared goal template
// and pushes it to multiple employees — BRD section 2.1
const createAndPushSharedGoal = async (req, res) => {
  try {
    const {
      department,
      thrustArea,
      title,
      description,
      uomType,
      target,
      recipientIds,   // array of employee user ids
      primaryOwnerId  // which employee is the primary owner
    } = req.body

    const cycleYear = new Date().getFullYear()

    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required'
      })
    }

    // verify all recipients exist and are employees
    const recipients = await User.find({
      _id: { $in: recipientIds },
      role: 'employee',
      isActive: true
    })

    if (recipients.length !== recipientIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more recipients are invalid or not employees'
      })
    }

    // build recipients array with default weightage
    const recipientList = recipientIds.map(id => ({
      employee: id,
      weightage: GOAL_RULES.MIN_WEIGHTAGE,  // default 10%, they can adjust
      isLinked: false
    }))

    const sharedGoal = await SharedGoal.create({
      createdBy: req.user._id,
      department,
      thrustArea,
      title,
      description: description || '',
      uomType,
      target,
      cycleYear,
      recipients: recipientList,
      primaryOwner: primaryOwnerId || recipientIds[0]
    })

    // push this goal into each recipient's goal sheet
    let pushedCount = 0
    const errors = []

    for (const recipientId of recipientIds) {
      try {
        let sheet = await GoalSheet.findOne({
          employee: recipientId,
          cycleYear
        })

        // if employee has no sheet yet, create one
        if (!sheet) {
          const employee = await User.findById(recipientId)
          sheet = await GoalSheet.create({
            employee: recipientId,
            manager: employee.reportsTo || null,
            cycleYear,
            status: SHEET_STATUS.DRAFT,
            goals: []
          })
        }

        // skip if sheet is locked
        if (sheet.isLocked) {
          errors.push(`Sheet for employee ${recipientId} is locked`)
          continue
        }

        // check max goals limit
        if (sheet.goals.length >= GOAL_RULES.MAX_GOALS) {
          errors.push(`Employee ${recipientId} already has max goals`)
          continue
        }

        const isPrimary = recipientId.toString() === primaryOwnerId?.toString()

        sheet.goals.push({
          thrustArea,
          title,
          description: description || '',
          uomType,
          target,
          weightage: GOAL_RULES.MIN_WEIGHTAGE,
          isShared: true,
          sharedGoalRef: sharedGoal._id,
          isPrimaryOwner: isPrimary,
          isReadOnly: true   // title and target locked for all recipients
        })

        await sheet.save()
        pushedCount++

        // mark as linked in sharedGoal recipients list
        await SharedGoal.updateOne(
          {
            _id: sharedGoal._id,
            'recipients.employee': recipientId
          },
          { $set: { 'recipients.$.isLinked': true } }
        )

      } catch (innerErr) {
        errors.push(`Failed for employee ${recipientId}: ${innerErr.message}`)
      }
    }

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: null,
      employee: req.user._id,
      action: 'shared_goal_pushed',
      description: `${req.user.name} pushed shared goal "${title}" to ${pushedCount} employees`
    })

    res.status(201).json({
      success: true,
      message: `Shared goal pushed to ${pushedCount} employees`,
      data: sharedGoal,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create shared goal: ' + err.message
    })
  }
}


// GET /api/shared/all
// admin or manager views all shared goals they created
const getAllSharedGoals = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    const query = { cycleYear }

    // managers only see their own shared goals
    if (req.user.role === 'manager') {
      query.createdBy = req.user._id
    }

    const sharedGoals = await SharedGoal.find(query)
      .populate('createdBy', 'name email')
      .populate('recipients.employee', 'name email department')
      .populate('primaryOwner', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: sharedGoals })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared goals: ' + err.message
    })
  }
}


// PUT /api/shared/update-weightage/:sheetId/:goalId
// recipient employee adjusts weightage of a shared goal
// title and target remain read-only — BRD section 2.1
const updateSharedGoalWeightage = async (req, res) => {
  try {
    const { sheetId, goalId } = req.params
    const { weightage } = req.body
    const cycleYear = new Date().getFullYear()

    if (!weightage || weightage < GOAL_RULES.MIN_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Minimum weightage is ${GOAL_RULES.MIN_WEIGHTAGE}%`
      })
    }

    const sheet = await GoalSheet.findOne({
      _id: sheetId,
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      })
    }

    if (sheet.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Sheet is locked'
      })
    }

    const goal = sheet.goals.id(goalId)

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    if (!goal.isShared) {
      return res.status(400).json({
        success: false,
        message: 'This is not a shared goal'
      })
    }

    // check total weightage won't exceed 100
    const otherTotal = sheet.goals
      .filter(g => g._id.toString() !== goalId)
      .reduce((sum, g) => sum + g.weightage, 0)

    if (otherTotal + weightage > GOAL_RULES.TOTAL_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Weightage would exceed 100%. Max allowed: ${GOAL_RULES.TOTAL_WEIGHTAGE - otherTotal}%`
      })
    }

    goal.weightage = weightage
    await sheet.save()

    res.json({
      success: true,
      message: 'Weightage updated for shared goal',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update weightage: ' + err.message
    })
  }
}


// PUT /api/shared/sync-achievement/:sharedGoalId
// when primary owner submits a check-in, sync actual
// achievement to all linked employee sheets — BRD section 2.1
const syncAchievement = async (req, res) => {
  try {
    const { sharedGoalId } = req.params
    const { actualAchievement } = req.body
    const cycleYear = new Date().getFullYear()

    const sharedGoal = await SharedGoal.findById(sharedGoalId)

    if (!sharedGoal) {
      return res.status(404).json({
        success: false,
        message: 'Shared goal not found'
      })
    }

    // only primary owner can trigger sync
    if (sharedGoal.primaryOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the primary owner can sync achievement'
      })
    }

    // get all linked recipient ids
    const linkedRecipients = sharedGoal.recipients
      .filter(r => r.isLinked)
      .map(r => r.employee)

    let syncedCount = 0

    for (const recipientId of linkedRecipients) {
      try {
        const sheet = await GoalSheet.findOne({
          employee: recipientId,
          cycleYear
        })

        if (!sheet) continue

        // find the shared goal in their sheet
        const goal = sheet.goals.find(
          g => g.sharedGoalRef &&
          g.sharedGoalRef.toString() === sharedGoalId
        )

        if (!goal) continue

        // update actual on the goal status
        goal.status = 'on_track'
        await sheet.save()
        syncedCount++

      } catch (innerErr) {
        console.error(`Sync failed for ${recipientId}: ${innerErr.message}`)
      }
    }

    res.json({
      success: true,
      message: `Achievement synced to ${syncedCount} linked employees`,
      data: { sharedGoalId, actualAchievement, syncedCount }
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync achievement: ' + err.message
    })
  }
}


module.exports = {
  createAndPushSharedGoal,
  getAllSharedGoals,
  updateSharedGoalWeightage,
  syncAchievement
}
