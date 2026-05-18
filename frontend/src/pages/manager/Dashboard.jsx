import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getTeamSheetsApi } from '../../api/goal.api'
import { getTeamCheckinsApi } from '../../api/checkin.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'

const StatCard = ({ label, value, color = 'text-gray-800', sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const ManagerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sheets, setSheets] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const sheetsRes = await getTeamSheetsApi()
      setSheets(sheetsRes.data.data || [])
    } catch {
      setSheets([])
    }
    try {
      const checkinsRes = await getTeamCheckinsApi()
      setCheckins(checkinsRes.data.data || [])
    } catch {
      setCheckins([])
    }
    setLoading(false)
  }

  if (loading) return <Layout><Loader /></Layout>

  const pending = sheets.filter(s => s.status === 'submitted').length
  const approved = sheets.filter(s => s.status === 'approved').length
  const draft = sheets.filter(s => s.status === 'draft').length
  const returned = sheets.filter(s => s.status === 'returned').length

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Manager Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · FY {new Date().getFullYear()}
          </p>
        </div>

        {pending > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800">
              {pending} goal sheet{pending > 1 ? 's' : ''} waiting for your approval
            </p>
            <button
              onClick={() => navigate('/manager/approvals')}
              className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
            >
              Review Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Approval" value={pending} color="text-yellow-600" sub="Submitted by team" />
          <StatCard label="Approved" value={approved} color="text-green-600" sub="Locked sheets" />
          <StatCard label="In Draft" value={draft} color="text-gray-600" sub="Not submitted yet" />
          <StatCard label="Returned" value={returned} color="text-red-500" sub="Sent back for rework" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Team Goal Sheets</h2>
            <button
              onClick={() => navigate('/manager/approvals')}
              className="text-sm text-primary-600 hover:underline"
            >
              Go to Approvals
            </button>
          </div>
          {sheets.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No team members have created goal sheets yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sheets.map((sheet, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {sheet.employee?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sheet.employee?.department} · {sheet.goals?.length} goals
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sheet.status} />
                    {sheet.status === 'submitted' && (
                      <button
                        onClick={() => navigate(`/manager/review/${sheet._id}`)}
                        className="text-xs bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/manager/approvals')}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 text-left"
          >
            <p className="font-semibold">Approval Queue</p>
            <p className="text-sm text-primary-100 mt-0.5">
              Review and approve team goal sheets
            </p>
          </button>
          <button
            onClick={() => navigate('/manager/checkins')}
            className="bg-white border border-gray-200 hover:bg-gray-50 rounded-xl p-4 text-left"
          >
            <p className="font-semibold text-gray-800">Team Check-ins</p>
            <p className="text-sm text-gray-400 mt-0.5">
              View planned vs actual and add comments
            </p>
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default ManagerDashboard
