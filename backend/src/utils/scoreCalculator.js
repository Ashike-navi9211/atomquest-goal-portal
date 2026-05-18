const { UOM_TYPES } = require('../config/constants')

// BRD section 2.2 — system computed progress scores
// returns a percentage score 0-100

const calculateScore = (uomType, target, actual) => {
  try {
    switch (uomType) {

      // higher is better — eg. sales revenue
      // formula: achievement / target * 100
      case UOM_TYPES.NUMERIC_MIN: {
        const t = parseFloat(target)
        const a = parseFloat(actual)
        if (!t || !a || t === 0) return 0
        const score = (a / t) * 100
        // cap at 100 for display — can exceed if overachieved
        return Math.min(Math.round(score), 150)
      }

      // lower is better — eg. TAT, cost
      // formula: target / achievement * 100
      case UOM_TYPES.NUMERIC_MAX: {
        const t = parseFloat(target)
        const a = parseFloat(actual)
        if (!t || !a || a === 0) return 0
        const score = (t / a) * 100
        return Math.min(Math.round(score), 150)
      }

      // date based completion
      // if completed on or before deadline = 100%, else proportional
      case UOM_TYPES.TIMELINE: {
        if (!actual || !target) return 0
        const deadline = new Date(target)
        const completion = new Date(actual)

        // completed before or on deadline = 100%
        if (completion <= deadline) return 100

        // overdue — calculate how late as a penalty
        // every day late reduces score
        const diffDays = Math.ceil(
          (completion - deadline) / (1000 * 60 * 60 * 24)
        )
        const score = Math.max(0, 100 - diffDays * 5)
        return Math.round(score)
      }

      // zero = success — eg. safety incidents
      // if actual is 0, score is 100%, anything else is 0%
      case UOM_TYPES.ZERO: {
        const a = parseFloat(actual)
        return a === 0 ? 100 : 0
      }

      default:
        return 0
    }

  } catch (err) {
    // dont crash the server if score calc fails
    console.error('Score calculation error:', err.message)
    return 0
  }
}

module.exports = { calculateScore }
