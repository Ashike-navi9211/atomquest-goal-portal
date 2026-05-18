const GoalSheet = require('../models/GoalSheet')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { SHEET_STATUS, GOAL_RULES } = require('../config/constants')


// GET /api/goals/my-sheet
// employee fetches their own goal sheet for current cycle
const getMySheet = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    let sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    }).populate('manager', 'name email')

    // if no sheet exists yet, return empty state
    if (!sheet) {
      return res.json({
        success: true,
        data: null,
        message: 'No goal sheet found for current cycle'
      })
    }

    res.json({ success: true, data: sheet })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sheet: ' + err.message
    })
  }
}


// POST /api/goals/init-sheet
// creates an empty draft sheet for the employee
const initSheet = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    // check if sheet already exists
    const existing = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Goal sheet already exists for this cycle'
      })
    }

    // get manager from user's reportsTo
    const employee = await User.findById(req.user._id)

    const sheet = await GoalSheet.create({
      employee: req.user._id,
      manager: employee.reportsTo || null,
      cycleYear,
      status: SHEET_STATUS.DRAFT,
      goals: []
    })

    res.status(201).json({
      success: true,
      message: 'Goal sheet initialized',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to init sheet: ' + err.message
    })
  }
}


// POST /api/goals/add-goal
// employee adds a single goal to their draft sheet
const addGoal = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { thrustArea, title, description, uomType, target, weightage } = req.body

    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found. Initialize it first.'
      })
    }

    if (sheet.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Goal sheet is locked after approval. Contact admin to unlock.'
      })
    }

    if (sheet.status === SHEET_STATUS.SUBMITTED || sheet.status === SHEET_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit a submitted or approved sheet'
      })
    }

    // check max goals limit
    if (sheet.goals.length >= GOAL_RULES.MAX_GOALS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${GOAL_RULES.MAX_GOALS} goals allowed`
      })
    }

    // check min weightage
    if (weightage < GOAL_RULES.MIN_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Minimum weightage per goal is ${GOAL_RULES.MIN_WEIGHTAGE}%`
      })
    }

    // check if adding this goal would exceed 100%
    const currentTotal = sheet.goals.reduce((sum, g) => sum + g.weightage, 0)
    if (currentTotal + weightage > GOAL_RULES.TOTAL_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Adding this goal would exceed 100% total weightage. Remaining: ${GOAL_RULES.TOTAL_WEIGHTAGE - currentTotal}%`
      })
    }

    sheet.goals.push({
      thrustArea,
      title,
      description: description || '',
      uomType,
      target,
      weightage
    })

    await sheet.save()

    res.status(201).json({
      success: true,
      message: 'Goal added successfully',
      data: sheet
    })

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, message: messages.join(', ') })
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add goal: ' + err.message
    })
  }
}


// PUT /api/goals/update-goal/:goalId
// employee edits a goal in their draft sheet
const updateGoal = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { goalId } = req.params
    const { thrustArea, title, description, uomType, target, weightage } = req.body

    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Sheet is locked. Contact admin to unlock.'
      })
    }

    if (sheet.status === SHEET_STATUS.SUBMITTED || sheet.status === SHEET_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit a submitted or approved sheet'
      })
    }

    // find the goal subdocument by its _id
    const goal = sheet.goals.id(goalId)
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    // shared goals — title and target are read-only for non-owners
    if (goal.isShared && goal.isReadOnly) {
      if (title !== goal.title || target !== goal.target) {
        return res.status(403).json({
          success: false,
          message: 'Title and target are read-only for shared goals'
        })
      }
    }

    // check weightage won't push total over 100
    const otherGoalsTotal = sheet.goals
      .filter(g => g._id.toString() !== goalId)
      .reduce((sum, g) => sum + g.weightage, 0)

    if (weightage && otherGoalsTotal + weightage > GOAL_RULES.TOTAL_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Weightage update would exceed 100%. Remaining: ${GOAL_RULES.TOTAL_WEIGHTAGE - otherGoalsTotal}%`
      })
    }

    // apply updates
    if (thrustArea) goal.thrustArea = thrustArea
    if (title && !goal.isReadOnly) goal.title = title
    if (description !== undefined) goal.description = description
    if (uomType) goal.uomType = uomType
    if (target && !goal.isReadOnly) goal.target = target
    if (weightage) goal.weightage = weightage

    await sheet.save()

    res.json({ success: true, message: 'Goal updated', data: sheet })

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ success: false, message: messages.join(', ') })
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update goal: ' + err.message
    })
  }
}


// DELETE /api/goals/remove-goal/:goalId
const removeGoal = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { goalId } = req.params

    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.isLocked || sheet.status === SHEET_STATUS.SUBMITTED || sheet.status === SHEET_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove goals from a submitted or approved sheet'
      })
    }

    const goal = sheet.goals.id(goalId)
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    sheet.goals.pull(goalId)
    await sheet.save()

    res.json({ success: true, message: 'Goal removed', data: sheet })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove goal: ' + err.message
    })
  }
}


// POST /api/goals/submit
// employee submits their sheet for manager approval
const submitSheet = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.goals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one goal before submitting'
      })
    }

    // enforce total weightage = 100 before submission
    const total = sheet.goals.reduce((sum, g) => sum + g.weightage, 0)
    if (total !== GOAL_RULES.TOTAL_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Total weightage must be exactly 100%. Current total: ${total}%`
      })
    }

    if (sheet.status === SHEET_STATUS.SUBMITTED) {
      return res.status(400).json({
        success: false,
        message: 'Sheet already submitted'
      })
    }

    if (sheet.status === SHEET_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Sheet already approved'
      })
    }

    sheet.status = SHEET_STATUS.SUBMITTED
    sheet.submittedAt = new Date()
    sheet.returnComment = ''

    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: req.user._id,
      action: 'sheet_submitted',
      description: `${req.user.name} submitted goal sheet for cycle ${cycleYear}`
    })

    res.json({
      success: true,
      message: 'Goal sheet submitted for manager approval',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit sheet: ' + err.message
    })
  }
}


// GET /api/goals/team-sheets
// manager fetches all submitted sheets from their team
const getTeamSheets = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    const sheets = await GoalSheet.find({
      manager: req.user._id,
      cycleYear
    }).populate('employee', 'name email department')

    res.json({ success: true, data: sheets })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team sheets: ' + err.message
    })
  }
}


// GET /api/goals/sheet/:sheetId
// manager or admin views a specific sheet
const getSheetById = async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId)
      .populate('employee', 'name email department')
      .populate('manager', 'name email')

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      })
    }

    // admin can view any sheet
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: sheet })
    }

    // manager can view if sheet belongs to their team
    // check both manager field and employee's reportsTo
    if (req.user.role === 'manager') {
      const employee = await User.findById(sheet.employee._id)

      const isTheirTeam =
        (sheet.manager && sheet.manager._id.toString() === req.user._id.toString()) ||
        (employee?.reportsTo && employee.reportsTo.toString() === req.user._id.toString())

      if (!isTheirTeam) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Not your team member.'
        })
      }
    }

    res.json({ success: true, data: sheet })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sheet: ' + err.message
    })
  }
}

// PUT /api/goals/approve/:sheetId
// manager approves the sheet — locks it
const approveSheet = async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId)

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve your own team members sheets'
      })
    }

    if (sheet.status !== SHEET_STATUS.SUBMITTED) {
      return res.status(400).json({
        success: false,
        message: 'Only submitted sheets can be approved'
      })
    }

    sheet.status = SHEET_STATUS.APPROVED
    sheet.isLocked = true
    sheet.lockedAt = new Date()
    sheet.approvedAt = new Date()

    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: sheet.employee,
      action: 'goal_approved',
      description: `Manager ${req.user.name} approved goal sheet`
    })

    res.json({
      success: true,
      message: 'Goal sheet approved and locked',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve sheet: ' + err.message
    })
  }
}


// PUT /api/goals/return/:sheetId
// manager returns sheet for rework with a comment
const returnSheet = async (req, res) => {
  try {
    const { comment } = req.body
    const sheet = await GoalSheet.findById(req.params.sheetId)

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    if (sheet.status !== SHEET_STATUS.SUBMITTED) {
      return res.status(400).json({
        success: false,
        message: 'Only submitted sheets can be returned'
      })
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a comment explaining what needs to be reworked'
      })
    }

    sheet.status = SHEET_STATUS.RETURNED
    sheet.returnComment = comment.trim()

    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: sheet.employee,
      action: 'goal_returned',
      description: `Manager ${req.user.name} returned sheet for rework. Reason: ${comment}`
    })

    res.json({
      success: true,
      message: 'Sheet returned for rework',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to return sheet: ' + err.message
    })
  }
}


// PUT /api/goals/manager-edit/:sheetId/:goalId
// manager edits targets/weightages inline during approval
const managerEditGoal = async (req, res) => {
  try {
    const { sheetId, goalId } = req.params
    const { target, weightage } = req.body

    const sheet = await GoalSheet.findById(sheetId)

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (sheet.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    if (sheet.status !== SHEET_STATUS.SUBMITTED) {
      return res.status(400).json({
        success: false,
        message: 'Can only edit goals on submitted sheets'
      })
    }

    const goal = sheet.goals.id(goalId)
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    const before = { target: goal.target, weightage: goal.weightage }

    if (target) goal.target = target
    if (weightage) {
      // verify weightage change won't break 100% rule
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
    }

    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: sheet.employee,
      action: 'goal_edited_after_lock',
      description: `Manager ${req.user.name} edited goal "${goal.title}" during approval`,
      before,
      after: { target: goal.target, weightage: goal.weightage }
    })

    res.json({ success: true, message: 'Goal updated by manager', data: sheet })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to edit goal: ' + err.message
    })
  }
}


// PUT /api/goals/unlock/:sheetId
// admin unlocks a locked sheet for edits — BRD section 2.1
const unlockSheet = async (req, res) => {
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId)
      .populate('employee', 'name')

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' })
    }

    if (!sheet.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Sheet is not locked'
      })
    }

    sheet.isLocked = false
    sheet.status = SHEET_STATUS.DRAFT

    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: sheet.employee._id,
      action: 'goal_unlocked',
      description: `Admin ${req.user.name} unlocked goal sheet for ${sheet.employee.name}`
    })

    res.json({
      success: true,
      message: 'Sheet unlocked successfully',
      data: sheet
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to unlock sheet: ' + err.message
    })
  }
}


module.exports = {
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
}
