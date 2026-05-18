const mongoose = require('mongoose')
const { UOM_TYPES, GOAL_STATUS, THRUST_AREAS } = require('../config/constants')

// this is a subdocument schema - not registered as a model
// it gets embedded inside GoalSheet.goals array
const goalSchema = new mongoose.Schema({
  thrustArea: {
    type: String,
    required: [true, 'Thrust area is required'],
    enum: THRUST_AREAS
  },

  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true
  },

  description: {
    type: String,
    trim: true,
    default: ''
  },

  uomType: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    enum: Object.values(UOM_TYPES)
  },

  // stored as string to handle both numeric and date targets
  // frontend sends "500000" for numeric or "2024-12-31" for timeline
  target: {
    type: String,
    required: [true, 'Target is required']
  },

  weightage: {
    type: Number,
    required: [true, 'Weightage is required'],
    min: [10, 'Minimum weightage per goal is 10%'],
    max: [100, 'Weightage cannot exceed 100%']
  },

  status: {
    type: String,
    enum: Object.values(GOAL_STATUS),
    default: GOAL_STATUS.NOT_STARTED
  },

  // shared goal fields — BRD section 2.1
  isShared: {
    type: Boolean,
    default: false
  },

  // ref to the SharedGoal document that pushed this goal
  sharedGoalRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedGoal',
    default: null
  },

  // true = this employee is the primary owner
  // achievement updates from owner sync to all linked sheets
  isPrimaryOwner: {
    type: Boolean,
    default: false
  },

  // for shared goals, title and target are read-only for non-owners
  // this flag is set when goal is pushed
  isReadOnly: {
    type: Boolean,
    default: false
  }

}, { _id: true })  // keep _id so checkins can reference individual goals

module.exports = goalSchema
