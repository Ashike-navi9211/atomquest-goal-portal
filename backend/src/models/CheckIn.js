const mongoose = require('mongoose')
const { GOAL_STATUS, UOM_TYPES } = require('../config/constants')

// one checkin document per goal per quarter
// so if employee has 5 goals and its Q1, there will be 5 checkin docs
const checkInSchema = new mongoose.Schema({
  goalSheet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalSheet',
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // which goal inside the sheet this checkin belongs to
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // q1_checkin, q2_checkin, q3_checkin, q4_annual
  quarter: {
    type: String,
    required: true,
    enum: ['q1_checkin', 'q2_checkin', 'q3_checkin', 'q4_annual']
  },

  cycleYear: {
    type: Number,
    required: true
  },

  // what the employee planned (copied from goal.target at time of checkin)
  plannedTarget: {
    type: String,
    required: true
  },

  // what employee actually achieved this quarter
  actualAchievement: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: Object.values(GOAL_STATUS),
    default: GOAL_STATUS.NOT_STARTED
  },

  // system computed score based on UoM formula from BRD section 2.2
  // stored as percentage 0-100
  progressScore: {
    type: Number,
    default: null
  },

  // uom type copied here so score can be recalculated without
  // going back to goalSheet every time
  uomType: {
    type: String,
    enum: Object.values(UOM_TYPES),
    required: true
  },

  // manager fills this during check-in review — BRD section 2.2
  managerComment: {
    type: String,
    default: ''
  },

  // when employee submitted their actual achievement
  submittedAt: {
    type: Date,
    default: null
  },

  // when manager added their comment
  reviewedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true })


// prevent duplicate checkins for same goal in same quarter
checkInSchema.index(
  { goalSheet: 1, goalId: 1, quarter: 1, cycleYear: 1 },
  { unique: true }
)

module.exports = mongoose.model('CheckIn', checkInSchema)
