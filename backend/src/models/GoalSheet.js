const mongoose = require('mongoose')
const { SHEET_STATUS, GOAL_RULES } = require('../config/constants')
const goalSchema = require('./Goal')

const goalSheetSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // denormalized for easy manager dashboard queries
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // financial year eg. 2024 means FY 2024-25
  cycleYear: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },

  status: {
    type: String,
    enum: Object.values(SHEET_STATUS),
    default: SHEET_STATUS.DRAFT
  },

  // goals array — embedded subdocuments using goalSchema
  goals: {
  type: [goalSchema],
  validate: [
    {
      validator: function(goals) {
        return goals.length <= GOAL_RULES.MAX_GOALS
      },
      message: `Maximum ${GOAL_RULES.MAX_GOALS} goals allowed per employee`
    }
  ],
  default: []
},

  // locked after manager approves — BRD section 2.1
  isLocked: {
    type: Boolean,
    default: false
  },

  lockedAt: {
    type: Date,
    default: null
  },

  submittedAt: {
    type: Date,
    default: null
  },

  approvedAt: {
    type: Date,
    default: null
  },

  // manager fills this when returning sheet for rework
  returnComment: {
    type: String,
    default: ''
  }

}, { timestamps: true })


// one sheet per employee per cycle year
goalSheetSchema.index({ employee: 1, cycleYear: 1 }, { unique: true })


module.exports = mongoose.model('GoalSheet', goalSheetSchema)
