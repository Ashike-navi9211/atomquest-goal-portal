// all BRD-defined rules and enums live here
// makes it easy to change one place if rules shift during demo

const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin'
}

const UOM_TYPES = {
  NUMERIC_MIN: 'numeric_min',   // higher is better eg. sales revenue
  NUMERIC_MAX: 'numeric_max',   // lower is better eg. TAT, cost
  TIMELINE: 'timeline',         // date based completion
  ZERO: 'zero'                  // zero = success eg. safety incidents
}

const GOAL_STATUS = {
  NOT_STARTED: 'not_started',
  ON_TRACK: 'on_track',
  COMPLETED: 'completed'
}

const SHEET_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned'   // manager returned for rework
}

// BRD section 2.1 validation rules
const GOAL_RULES = {
  MAX_GOALS: 8,
  MIN_WEIGHTAGE: 10,    // percent
  TOTAL_WEIGHTAGE: 100  // percent
}

// BRD section 2.3 cycle windows
// month is 0-indexed (JS Date)
const CYCLE_WINDOWS = [
  {
    name: 'goal_setting',
    label: 'Phase 1 - Goal Setting',
    openMonth: 4,   // May
    action: 'Goal Creation, Submission & Approval'
  },
  {
    name: 'q1_checkin',
    label: 'Q1 Check-in',
    openMonth: 6,   // July
    action: 'Progress Update - Planned vs Actual'
  },
  {
    name: 'q2_checkin',
    label: 'Q2 Check-in',
    openMonth: 9,   // October
    action: 'Progress Update - Planned vs Actual'
  },
  {
    name: 'q3_checkin',
    label: 'Q3 Check-in',
    openMonth: 0,   // January
    action: 'Progress Update - Planned vs Actual'
  },
  {
    name: 'q4_annual',
    label: 'Q4 / Annual',
    openMonth: 2,   // March
    action: 'Final Achievement Capture'
  }
]

const THRUST_AREAS = [
  'Sales & Revenue',
  'Operations',
  'Product & Engineering',
  'Customer Success',
  'Human Resources',
  'Finance',
  'Marketing',
  'Quality & Compliance'
]

module.exports = {
  ROLES,
  UOM_TYPES,
  GOAL_STATUS,
  SHEET_STATUS,
  GOAL_RULES,
  CYCLE_WINDOWS,
  THRUST_AREAS
}
