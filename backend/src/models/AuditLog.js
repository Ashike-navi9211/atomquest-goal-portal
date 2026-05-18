const mongoose = require('mongoose')

// tracks all changes made to goals AFTER the lock date
// BRD section 4 — audit trail requirement
const auditLogSchema = new mongoose.Schema({
  // who made the change
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // which goal sheet was affected
  goalSheet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalSheet',
    required: true
  },

  // which employee owns the sheet
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // what action was performed
  action: {
    type: String,
    required: true,
    enum: [
      'goal_unlocked',
      'goal_edited_after_lock',
      'goal_approved',
      'goal_returned',
      'checkin_submitted',
      'checkin_commented',
      'sheet_submitted',
      'shared_goal_pushed'
    ]
  },

  // human readable description of what changed
  description: {
    type: String,
    required: true
  },

  // snapshot of what changed — before and after values
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }

}, { timestamps: true })  // createdAt acts as the "when" for audit

module.exports = mongoose.model('AuditLog', auditLogSchema)
