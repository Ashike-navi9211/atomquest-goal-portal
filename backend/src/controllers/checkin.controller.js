const GoalSheet = require('../models/GoalSheet')
const CheckIn = require('../models/CheckIn')
const AuditLog = require('../models/AuditLog')
const { calculateScore } = require('../utils/scoreCalculator')
const { GOAL_STATUS, SHEET_STATUS } = require('../config/constants')
const { getCurrentCycle } = require('../middleware/cycle.middleware')


// POST /api/checkin/submit
// employee submits actual achievement for current quarter
const submitCheckin = async (req, res) => {
  try {
    const { goalId, actualAchievement, status } = req.body
    const cycleYear = new Date().getFullYear()

    // get current active quarter from cycle helper
    const currentCycle = getCurrentCycle()
    const checkinWindows = ['q1_checkin', 'q2_checkin', 'q3_checkin', 'q4_annual']

    if (!checkinWindows.includes(currentCycle.name)) {
      return res.status(403).json({
        success: false,
        message: `Check-ins are not open. Current phase: ${currentCycle.label}`
      })
    }

    // find the employee's sheet
    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found'
      })
    }

    if (sheet.status !== SHEET_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Only approved goal sheets can have check-ins'
      })
    }

    // find the specific goal in the sheet
    const goal = sheet.goals.id(goalId)
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found in sheet'
      })
    }

    // check if checkin already exists for this goal this quarter
    const existing = await CheckIn.findOne({
      goalSheet: sheet._id,
      goalId,
      quarter: currentCycle.name,
      cycleYear
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Check-in already submitted for this goal this quarter. Use update instead.'
      })
    }

    // compute progress score based on UoM formula
    const progressScore = calculateScore(
      goal.uomType,
      goal.target,
      actualAchievement
    )

    const checkin = await CheckIn.create({
      goalSheet: sheet._id,
      employee: req.user._id,
      manager: sheet.manager,
      goalId,
      quarter: currentCycle.name,
      cycleYear,
      plannedTarget: goal.target,
      actualAchievement,
      status: status || GOAL_STATUS.ON_TRACK,
      progressScore,
      uomType: goal.uomType,
      submittedAt: new Date()
    })

    // update goal status on the sheet too
    goal.status = status || GOAL_STATUS.ON_TRACK
    await sheet.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: sheet._id,
      employee: req.user._id,
      action: 'checkin_submitted',
      description: `${req.user.name} submitted ${currentCycle.label} check-in for goal "${goal.title}". Score: ${progressScore}%`
    })

    res.status(201).json({
      success: true,
      message: 'Check-in submitted successfully',
      data: checkin
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit check-in: ' + err.message
    })
  }
}


// PUT /api/checkin/update/:checkinId
// employee updates an existing check-in in the same window
const updateCheckin = async (req, res) => {
  try {
    const { actualAchievement, status } = req.body
    const { checkinId } = req.params

    const checkin = await CheckIn.findById(checkinId)

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found'
      })
    }

    // only the employee who owns it can update
    if (checkin.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // recalculate score with new actual
    const progressScore = calculateScore(
      checkin.uomType,
      checkin.plannedTarget,
      actualAchievement
    )

    checkin.actualAchievement = actualAchievement
    checkin.status = status || checkin.status
    checkin.progressScore = progressScore
    checkin.submittedAt = new Date()

    await checkin.save()

    res.json({
      success: true,
      message: 'Check-in updated',
      data: checkin
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update check-in: ' + err.message
    })
  }
}


// GET /api/checkin/my-checkins
// employee views all their check-ins
const getMyCheckins = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()

    const sheet = await GoalSheet.findOne({
      employee: req.user._id,
      cycleYear
    })

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'No goal sheet found'
      })
    }

    const checkins = await CheckIn.find({
      goalSheet: sheet._id,
      cycleYear
    }).sort({ createdAt: -1 })

    res.json({ success: true, data: checkins })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch check-ins: ' + err.message
    })
  }
}


// GET /api/checkin/team-checkins
// manager views all check-ins from their team for current quarter
const getTeamCheckins = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { quarter } = req.query

    const query = {
      manager: req.user._id,
      cycleYear
    }

    // optionally filter by quarter
    if (quarter) query.quarter = quarter

    const checkins = await CheckIn.find(query)
      .populate('employee', 'name email department')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: checkins })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team check-ins: ' + err.message
    })
  }
}


// GET /api/checkin/sheet-checkins/:sheetId
// manager views all check-ins for a specific employee sheet
const getSheetCheckins = async (req, res) => {
  try {
    const { sheetId } = req.params

    const checkins = await CheckIn.find({
      goalSheet: sheetId
    }).sort({ quarter: 1, createdAt: -1 })

    res.json({ success: true, data: checkins })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch check-ins: ' + err.message
    })
  }
}


// PUT /api/checkin/comment/:checkinId
// manager adds a structured check-in comment — BRD section 2.2
const addManagerComment = async (req, res) => {
  try {
    const { comment } = req.body
    const { checkinId } = req.params

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      })
    }

    const checkin = await CheckIn.findById(checkinId)
      .populate('employee', 'name')

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found'
      })
    }

    // verify this manager owns the check-in
    if (checkin.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not your team member.'
      })
    }

    checkin.managerComment = comment.trim()
    checkin.reviewedAt = new Date()

    await checkin.save()

    await AuditLog.create({
      changedBy: req.user._id,
      goalSheet: checkin.goalSheet,
      employee: checkin.employee._id,
      action: 'checkin_commented',
      description: `Manager ${req.user.name} commented on ${checkin.quarter} check-in for ${checkin.employee.name}`
    })

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: checkin
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment: ' + err.message
    })
  }
}


module.exports = {
  submitCheckin,
  updateCheckin,
  getMyCheckins,
  getTeamCheckins,
  getSheetCheckins,
  addManagerComment
}
