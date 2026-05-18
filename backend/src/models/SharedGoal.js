const mongoose = require('mongoose')
const { UOM_TYPES, THRUST_AREAS } = require('../config/constants')

// admin or manager creates a shared goal template
// then pushes it to multiple employees
// BRD section 2.1 — shared goals functionality
const sharedGoalSchema = new mongoose.Schema({
  // who created and pushed this shared goal
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // department this KPI belongs to
  department: {
    type: String,
    required: true,
    trim: true
  },

  thrustArea: {
    type: String,
    required: true,
    enum: THRUST_AREAS
  },

  // read-only for all recipients — BRD section 2.1
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: '',
    trim: true
  },

  uomType: {
    type: String,
    required: true,
    enum: Object.values(UOM_TYPES)
  },

  // read-only for all recipients — BRD section 2.1
  target: {
    type: String,
    required: true
  },

  cycleYear: {
    type: Number,
    required: true
  },

  // list of employees this was pushed to
  recipients: [
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      // each recipient can only adjust their own weightage
      weightage: {
        type: Number,
        default: 10,
        min: 10,
        max: 100
      },
      // once pushed and employee saves it, mark as linked
      isLinked: {
        type: Boolean,
        default: false
      }
    }
  ],

  // the primary owner whose actual achievement
  // syncs to all other linked sheets — BRD section 2.1
  primaryOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true })

module.exports = mongoose.model('SharedGoal', sharedGoalSchema)
