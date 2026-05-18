import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMySheetApi } from '../../api/goal.api'
import { getMyCheckinsApi } from '../../api/checkin.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'

const StatCard = ({ label, value, sub, color = 'text-gray-800' }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sheet, setSheet] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const sheetRes = await getMySheetApi()
      setSheet(sheetRes.data.data)
    } catch {
      setSheet(null)
    }

    try {
      const checkinRes = await getMyCheckinsApi()
      setCheckins(checkinRes.data.data || [])
    } catch {
      setCheckins([])
    }

    setLoading(false)
  }

  if (loading) return <Layout><Loader /></Layout>

  const totalGoals = sheet?.goals?.length || 0
  const totalWeightage = sheet?.goals?.reduce((s, g) => s + g.weightage, 0) || 0
  const completedGoals = sheet?.goals?.filter(g => g.status === 'completed').length || 0
  const latestCheckins = checkins.slice(0, 5)

  return (
    <Layout>
      <div className="space-y-6">

        {/* welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            FY {new Date().getFullYear()} — Goal Tracking Overview
          </p>
        </div>

        {/* no sheet alert */}
        {!sheet && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                No goal sheet found for this cycle
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Go to Goal Sheet to get started
              </p>
            </div>
            <button
              onClick={() => navigate('/employee/goals')}
              className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Now
            </button>
          </div>
        )}

        {/* returned for rework alert */}
        {sheet?.status === 'returned' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">
              Your goal sheet was returned for rework
            </p>
            <p className="text-sm text-red-500 mt-1 italic">
              "{sheet.returnComment}"
            </p>
            <button
              onClick={() => navigate('/employee/goals')}
              className="mt-2 text-sm text-red-600 underline"
            >
              Go fix it
            </button>
          </div>
        )}

        {/* stat cards */}
        {sheet && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Sheet Status"
              value={
                sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)
              }
              sub={sheet.isLocked ? 'Locked after approval' : 'Editable'}
              color={
                sheet.status === 'approved' ? 'text-green-600' :
                sheet.status === 'submitted' ? 'text-yellow-600' :
                sheet.status === 'returned' ? 'text-red-600' :
                'text-gray-700'
              }
            />
            <StatCard
              label="Total Goals"
              value={totalGoals}
              sub="Max 8 allowed"
            />
            <StatCard
              label="Total Weightage"
              value={`${totalWeightage}%`}
              sub="Must equal 100%"
              color={totalWeightage === 100 ? 'text-green-600' : 'text-yellow-500'}
            />
            <StatCard
              label="Completed Goals"
              value={completedGoals}
              sub={`of ${totalGoals} total`}
              color="text-primary-600"
            />
          </div>
        )}

        {/* goals list */}
        {sheet && sheet.goals.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">My Goals</h2>
              <button
                onClick={() => navigate('/employee/goals')}
                className="text-sm text-primary-600 hover:underline"
              >
                View Full Sheet
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {sheet.goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {goal.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {goal.thrustArea} · {goal.weightage}% weightage · Target: {goal.target}
                    </p>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* recent checkins */}
        {latestCheckins.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Recent Check-ins</h2>
              <button
                onClick={() => navigate('/employee/checkin')}
                className="text-sm text-primary-600 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {latestCheckins.map((ci, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {ci.quarter.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Target: {ci.plannedTarget} · Actual: {ci.actualAchievement}
                    </p>
                    {ci.managerComment && (
                      <p className="text-xs text-blue-500 mt-0.5 italic">
                        Manager: "{ci.managerComment}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {ci.progressScore !== null && (
                      <span className={`text-sm font-bold ${
                        ci.progressScore >= 90 ? 'text-green-600' :
                        ci.progressScore >= 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {ci.progressScore}%
                      </span>
                    )}
                    <StatusBadge status={ci.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/employee/goals')}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 text-left transition-colors"
          >
            <p className="font-semibold">Goal Sheet</p>
            <p className="text-sm text-primary-100 mt-0.5">
              Create, edit and submit your goals
            </p>
          </button>
          <button
            onClick={() => navigate('/employee/checkin')}
            className="bg-white border border-gray-200 hover:bg-gray-50 rounded-xl p-4 text-left transition-colors"
          >
            <p className="font-semibold text-gray-800">Quarterly Check-in</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Log actual achievement for this quarter
            </p>
          </button>
        </div>

      </div>
    </Layout>
  )
}

export default EmployeeDashboard
