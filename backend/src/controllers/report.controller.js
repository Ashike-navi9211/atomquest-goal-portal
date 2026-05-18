const ExcelJS = require('exceljs')
const GoalSheet = require('../models/GoalSheet')
const CheckIn = require('../models/CheckIn')
const User = require('../models/User')
const { calculateScore } = require('../utils/scoreCalculator')


// GET /api/reports/achievement
// returns achievement data as JSON for frontend table
const getAchievementReport = async (req, res) => {
  try {
    const cycleYear = parseInt(req.query.year) || new Date().getFullYear()
    const { department, quarter } = req.query

    // get all approved sheets for the cycle
    let sheets = await GoalSheet.find({
      cycleYear,
      status: 'approved'
    })
      .populate('employee', 'name email department')
      .populate('manager', 'name email')

    // filter by department if provided
    if (department) {
      sheets = sheets.filter(
        s => s.employee && s.employee.department === department
      )
    }

    const report = []

    for (const sheet of sheets) {
      // get checkins for this sheet
      const checkinQuery = {
        goalSheet: sheet._id,
        cycleYear
      }
      if (quarter) checkinQuery.quarter = quarter

      const checkins = await CheckIn.find(checkinQuery)

      for (const goal of sheet.goals) {
        // find checkin for this specific goal
        const goalCheckins = checkins.filter(
          c => c.goalId.toString() === goal._id.toString()
        )

        // use latest checkin if multiple quarters
        const latestCheckin = goalCheckins.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0]

        report.push({
          employeeName: sheet.employee?.name || 'N/A',
          employeeEmail: sheet.employee?.email || 'N/A',
          department: sheet.employee?.department || 'N/A',
          managerName: sheet.manager?.name || 'N/A',
          cycleYear,
          thrustArea: goal.thrustArea,
          goalTitle: goal.title,
          uomType: goal.uomType,
          weightage: goal.weightage,
          target: goal.target,
          actualAchievement: latestCheckin?.actualAchievement || 'Not submitted',
          progressScore: latestCheckin?.progressScore ?? 'N/A',
          status: latestCheckin?.status || goal.status,
          quarter: latestCheckin?.quarter || 'N/A',
          managerComment: latestCheckin?.managerComment || ''
        })
      }
    }

    res.json({ success: true, data: report })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate report: ' + err.message
    })
  }
}


// GET /api/reports/export-excel
// exports achievement report as downloadable Excel file
// BRD section 4 — exportable CSV/Excel
const exportExcel = async (req, res) => {
  try {
    const cycleYear = parseInt(req.query.year) || new Date().getFullYear()
    const { department, quarter } = req.query

    let sheets = await GoalSheet.find({
      cycleYear,
      status: 'approved'
    })
      .populate('employee', 'name email department')
      .populate('manager', 'name email')

    if (department) {
      sheets = sheets.filter(
        s => s.employee && s.employee.department === department
      )
    }

    // build workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AtomQuest Goal Portal'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Achievement Report')

    // header row styling
    worksheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 22 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Manager', key: 'manager', width: 20 },
      { header: 'Thrust Area', key: 'thrustArea', width: 22 },
      { header: 'Goal Title', key: 'goalTitle', width: 30 },
      { header: 'UoM Type', key: 'uomType', width: 15 },
      { header: 'Weightage (%)', key: 'weightage', width: 14 },
      { header: 'Target', key: 'target', width: 15 },
      { header: 'Actual Achievement', key: 'actual', width: 20 },
      { header: 'Progress Score (%)', key: 'score', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Quarter', key: 'quarter', width: 14 },
      { header: 'Manager Comment', key: 'comment', width: 35 }
    ]

    // style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A5F' }
      }
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    headerRow.height = 22

    // populate rows
    for (const sheet of sheets) {
      const checkinQuery = { goalSheet: sheet._id, cycleYear }
      if (quarter) checkinQuery.quarter = quarter

      const checkins = await CheckIn.find(checkinQuery)

      for (const goal of sheet.goals) {
        const goalCheckins = checkins.filter(
          c => c.goalId.toString() === goal._id.toString()
        )

        const latestCheckin = goalCheckins.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0]

        const row = worksheet.addRow({
          employeeName: sheet.employee?.name || 'N/A',
          email: sheet.employee?.email || 'N/A',
          department: sheet.employee?.department || 'N/A',
          manager: sheet.manager?.name || 'N/A',
          thrustArea: goal.thrustArea,
          goalTitle: goal.title,
          uomType: goal.uomType,
          weightage: goal.weightage,
          target: goal.target,
          actual: latestCheckin?.actualAchievement || 'Not submitted',
          score: latestCheckin?.progressScore ?? 'N/A',
          status: latestCheckin?.status || goal.status,
          quarter: latestCheckin?.quarter || 'N/A',
          comment: latestCheckin?.managerComment || ''
        })

        // color code score column
        const scoreCell = row.getCell('score')
        if (typeof latestCheckin?.progressScore === 'number') {
          const score = latestCheckin.progressScore
          if (score >= 90) {
            scoreCell.font = { color: { argb: 'FF1A7F3C' }, bold: true }
          } else if (score >= 60) {
            scoreCell.font = { color: { argb: 'FFCA8A04' }, bold: true }
          } else {
            scoreCell.font = { color: { argb: 'FFB91C1C' }, bold: true }
          }
        }

        row.alignment = { vertical: 'middle' }
      }
    }

    // freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // add auto filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 14 }
    }

    // set response headers for file download
    const filename = `achievement_report_${cycleYear}${quarter ? '_' + quarter : ''}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )

    await workbook.xlsx.write(res)
    res.end()

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to export Excel: ' + err.message
    })
  }
}


// GET /api/reports/export-csv
// lighter CSV export option
const exportCSV = async (req, res) => {
  try {
    const cycleYear = parseInt(req.query.year) || new Date().getFullYear()
    const { department, quarter } = req.query

    let sheets = await GoalSheet.find({
      cycleYear,
      status: 'approved'
    })
      .populate('employee', 'name email department')
      .populate('manager', 'name email')

    if (department) {
      sheets = sheets.filter(
        s => s.employee && s.employee.department === department
      )
    }

    const rows = []

    // csv header
    rows.push([
      'Employee Name', 'Email', 'Department', 'Manager',
      'Thrust Area', 'Goal Title', 'UoM Type', 'Weightage (%)',
      'Target', 'Actual Achievement', 'Progress Score (%)',
      'Status', 'Quarter', 'Manager Comment'
    ].join(','))

    for (const sheet of sheets) {
      const checkinQuery = { goalSheet: sheet._id, cycleYear }
      if (quarter) checkinQuery.quarter = quarter

      const checkins = await CheckIn.find(checkinQuery)

      for (const goal of sheet.goals) {
        const goalCheckins = checkins.filter(
          c => c.goalId.toString() === goal._id.toString()
        )

        const latestCheckin = goalCheckins.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0]

        // wrap fields in quotes to handle commas in text
        const escape = val => `"${String(val || '').replace(/"/g, '""')}"`

        rows.push([
          escape(sheet.employee?.name),
          escape(sheet.employee?.email),
          escape(sheet.employee?.department),
          escape(sheet.manager?.name),
          escape(goal.thrustArea),
          escape(goal.title),
          escape(goal.uomType),
          goal.weightage,
          escape(goal.target),
          escape(latestCheckin?.actualAchievement || 'Not submitted'),
          latestCheckin?.progressScore ?? 'N/A',
          escape(latestCheckin?.status || goal.status),
          escape(latestCheckin?.quarter || 'N/A'),
          escape(latestCheckin?.managerComment || '')
        ].join(','))
      }
    }

    const csvContent = rows.join('\n')
    const filename = `achievement_report_${cycleYear}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV: ' + err.message
    })
  }
}


// GET /api/reports/manager-summary
// per manager — how many of their team have completed checkins
// used in completion dashboard
const getManagerSummary = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear()
    const { quarter } = req.query

    const managers = await User.find({
      role: 'manager',
      isActive: true
    }).select('name email department')

    const summary = []

    for (const manager of managers) {
      // total team members
      const teamCount = await User.countDocuments({
        reportsTo: manager._id,
        isActive: true
      })

      // approved sheets in their team
      const approvedCount = await GoalSheet.countDocuments({
        manager: manager._id,
        cycleYear,
        status: 'approved'
      })

      // submitted but pending
      const pendingCount = await GoalSheet.countDocuments({
        manager: manager._id,
        cycleYear,
        status: 'submitted'
      })

      // checkin completion if quarter provided
      let checkinCount = 0
      let commentCount = 0

      if (quarter) {
        checkinCount = await CheckIn.countDocuments({
          manager: manager._id,
          cycleYear,
          quarter
        })

        commentCount = await CheckIn.countDocuments({
          manager: manager._id,
          cycleYear,
          quarter,
          managerComment: { $ne: '' }
        })
      }

      summary.push({
        manager: {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          department: manager.department
        },
        teamSize: teamCount,
        approvedSheets: approvedCount,
        pendingApproval: pendingCount,
        notSubmitted: teamCount - approvedCount - pendingCount,
        checkinCount,
        commentCount
      })
    }

    res.json({ success: true, data: summary })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manager summary: ' + err.message
    })
  }
}


module.exports = {
  getAchievementReport,
  exportExcel,
  exportCSV,
  getManagerSummary
}
