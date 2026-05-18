const { CYCLE_WINDOWS } = require('../config/constants')

// determines which cycle window is currently active
// based on current month
const getCurrentCycle = () => {
  const currentMonth = new Date().getMonth() // 0-indexed

  // find the last window that has opened (openMonth <= currentMonth)
  // cycle windows are ordered by openMonth in constants
  // need to handle year wrap (jan = 0 comes after dec = 11)

  let activeCycle = null

  for (const window of CYCLE_WINDOWS) {
    if (currentMonth >= window.openMonth) {
      activeCycle = window
    }
  }

  // if no window matched (eg. before May in a new year)
  // default to goal_setting if we're in jan-apr range
  if (!activeCycle) {
    activeCycle = CYCLE_WINDOWS.find(w => w.name === 'goal_setting')
  }

  return activeCycle
}

// middleware to allow only during goal_setting window
const requireGoalSettingWindow = (req, res, next) => {
  const cycle = getCurrentCycle()

  if (cycle.name !== 'goal_setting') {
    return res.status(403).json({
      success: false,
      message: `Goal creation is only allowed during the Goal Setting phase (May). Current phase: ${cycle.label}`
    })
  }

  next()
}

// middleware to allow only during checkin windows
const requireCheckinWindow = (req, res, next) => {
  const cycle = getCurrentCycle()

  const checkinWindows = ['q1_checkin', 'q2_checkin', 'q3_checkin', 'q4_annual']

  if (!checkinWindows.includes(cycle.name)) {
    return res.status(403).json({
      success: false,
      message: `Check-ins are not open in the current phase: ${cycle.label}`
    })
  }

  // attach current quarter to request so controller knows which quarter
  req.currentQuarter = cycle.name
  next()
}

module.exports = {
  getCurrentCycle,
  requireGoalSettingWindow,
  requireCheckinWindow
}
