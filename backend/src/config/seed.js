require('dotenv').config({ path: '../../.env' })
const mongoose = require('mongoose')
const User = require('../models/User')
const GoalSheet = require('../models/GoalSheet')
const CheckIn = require('../models/CheckIn')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atomquest_portal'

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // clean existing data
    await User.deleteMany({})
    await GoalSheet.deleteMany({})
    await CheckIn.deleteMany({})
    console.log('Cleared existing data')

    // create admin
    const admin = await User.create({
      name: 'Admin HR',
      email: 'admin@atomquest.com',
      password: 'admin123',
      role: 'admin',
      department: 'Human Resources'
    })
    console.log('Admin created:', admin.email)

    // create managers
    const manager1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'manager1@atomquest.com',
      password: 'manager123',
      role: 'manager',
      department: 'Sales & Revenue'
    })

    const manager2 = await User.create({
      name: 'Priya Sharma',
      email: 'manager2@atomquest.com',
      password: 'manager123',
      role: 'manager',
      department: 'Product & Engineering'
    })
    console.log('Managers created')

    // create employees under manager1
    const emp1 = await User.create({
      name: 'Amit Verma',
      email: 'emp1@atomquest.com',
      password: 'emp123',
      role: 'employee',
      department: 'Sales & Revenue',
      reportsTo: manager1._id
    })

    const emp2 = await User.create({
      name: 'Neha Singh',
      email: 'emp2@atomquest.com',
      password: 'emp123',
      role: 'employee',
      department: 'Sales & Revenue',
      reportsTo: manager1._id
    })

    // create employees under manager2
    const emp3 = await User.create({
      name: 'Rohit Patel',
      email: 'emp3@atomquest.com',
      password: 'emp123',
      role: 'employee',
      department: 'Product & Engineering',
      reportsTo: manager2._id
    })

    const emp4 = await User.create({
      name: 'Sneha Joshi',
      email: 'emp4@atomquest.com',
      password: 'emp123',
      role: 'employee',
      department: 'Product & Engineering',
      reportsTo: manager2._id
    })
    console.log('Employees created')

    const cycleYear = new Date().getFullYear()

    // create a fully approved sheet for emp1 — good for demo
    const sheet1 = await GoalSheet.create({
      employee: emp1._id,
      manager: manager1._id,
      cycleYear,
      status: 'approved',
      isLocked: true,
      lockedAt: new Date(),
      submittedAt: new Date(),
      approvedAt: new Date(),
      goals: [
        {
          thrustArea: 'Sales & Revenue',
          title: 'Achieve Q1 Sales Target',
          description: 'Hit monthly revenue targets across assigned territory',
          uomType: 'numeric_min',
          target: '5000000',
          weightage: 40,
          status: 'on_track'
        },
        {
          thrustArea: 'Sales & Revenue',
          title: 'Reduce Customer Churn',
          description: 'Reduce churn rate below 5%',
          uomType: 'numeric_max',
          target: '5',
          weightage: 30,
          status: 'not_started'
        },
        {
          thrustArea: 'Operations',
          title: 'Complete Sales Training',
          description: 'Finish all mandatory sales training modules',
          uomType: 'timeline',
          target: `${cycleYear}-09-30`,
          weightage: 20,
          status: 'not_started'
        },
        {
          thrustArea: 'Quality & Compliance',
          title: 'Zero Compliance Violations',
          description: 'Maintain zero compliance incidents',
          uomType: 'zero',
          target: '0',
          weightage: 10,
          status: 'not_started'
        }
      ]
    })

    // create a draft sheet for emp2 — shows pending state
    await GoalSheet.create({
      employee: emp2._id,
      manager: manager1._id,
      cycleYear,
      status: 'draft',
      goals: [
        {
          thrustArea: 'Sales & Revenue',
          title: 'New Client Acquisition',
          description: 'Onboard 10 new enterprise clients',
          uomType: 'numeric_min',
          target: '10',
          weightage: 50,
          status: 'not_started'
        },
        {
          thrustArea: 'Operations',
          title: 'Pipeline Management',
          description: 'Maintain 3x pipeline coverage at all times',
          uomType: 'numeric_min',
          target: '3',
          weightage: 50,
          status: 'not_started'
        }
      ]
    })

    // create submitted sheet for emp3 — manager can approve during demo
    await GoalSheet.create({
      employee: emp3._id,
      manager: manager2._id,
      cycleYear,
      status: 'submitted',
      submittedAt: new Date(),
      goals: [
        {
          thrustArea: 'Product & Engineering',
          title: 'Feature Delivery On Time',
          description: 'Deliver all sprint features within planned timeline',
          uomType: 'numeric_min',
          target: '90',
          weightage: 40,
          status: 'not_started'
        },
        {
          thrustArea: 'Product & Engineering',
          title: 'Reduce Bug Count',
          description: 'Reduce production bugs by 30%',
          uomType: 'numeric_max',
          target: '30',
          weightage: 30,
          status: 'not_started'
        },
        {
          thrustArea: 'Operations',
          title: 'System Uptime',
          description: 'Maintain 99.9% uptime for owned services',
          uomType: 'numeric_min',
          target: '99.9',
          weightage: 30,
          status: 'not_started'
        }
      ]
    })

    // create checkin for emp1 sheet goal 1 — shows check-in flow
    const goal1 = sheet1.goals[0]
    await CheckIn.create({
      goalSheet: sheet1._id,
      employee: emp1._id,
      manager: manager1._id,
      goalId: goal1._id,
      quarter: 'q1_checkin',
      cycleYear,
      plannedTarget: goal1.target,
      actualAchievement: '3800000',
      status: 'on_track',
      progressScore: 76,
      uomType: goal1.uomType,
      submittedAt: new Date(),
      managerComment: 'Good progress Amit. Push harder in July to close the gap.'
    })
    console.log('Sample goal sheets and check-ins created')

    console.log('\n--- DEMO LOGIN CREDENTIALS ---')
    console.log('Admin:    admin@atomquest.com    / admin123')
    console.log('Manager1: manager1@atomquest.com / manager123')
    console.log('Manager2: manager2@atomquest.com / manager123')
    console.log('Employee1: emp1@atomquest.com    / emp123')
    console.log('Employee2: emp2@atomquest.com    / emp123')
    console.log('Employee3: emp3@atomquest.com    / emp123')
    console.log('Employee4: emp4@atomquest.com    / emp123')
    console.log('------------------------------\n')

    await mongoose.disconnect()
    console.log('Seed complete. Database disconnected.')
    process.exit(0)

  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
