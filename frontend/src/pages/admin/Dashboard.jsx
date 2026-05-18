import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompletionStatsApi } from '../../api/admin.api'
import Layout from '../../components/common/Layout'
import Loader from '../../components/common/Loader'

const StatCard = ({ label, value, color = 'text-gray-800', sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await getCompletionStatsApi()
      setStats(res.data.data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            FY {new Date().getFullYear()} — Organisation Overview
          </p>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Employees"
                value={stats.totalEmployees}
                sub="Active users"
              />
              <StatCard
                label="Sheets Submitted"
                value={stats.submittedSheets}
                color="text-yellow-600"
                sub={`of ${stats.totalEmployees} employees`}
              />
              <StatCard
                label="Sheets Approved"
                value={stats.approvedSheets}
                color="text-green-600"
                sub="Locked and active"
              />
              <StatCard
                label="Not Submitted"
                value={stats.notSubmitted}
                color="text-red-500"
                sub="No sheet yet"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Overall Submission Rate
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {stats.totalEmployees > 0
                    ? Math.round(
                        (stats.submittedSheets / stats.totalEmployees) * 100
                      )
                    : 0}%
                </p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-primary-500 transition-all"
                  style={{
                    width: `${
                      stats.totalEmployees > 0
                        ? Math.round(
                            (stats.submittedSheets / stats.totalEmployees) * 100
                          )
                        : 0
                    }%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{stats.submittedSheets} submitted</span>
                <span>{stats.pendingApproval} pending approval</span>
                <span>{stats.approvedSheets} approved</span>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: 'User Management',
              sub: 'Add and manage users',
              path: '/admin/users',
              color: 'bg-blue-50 border-blue-100'
            },
            {
              label: 'All Goal Sheets',
              sub: 'View all employee sheets',
              path: '/admin/sheets',
              color: 'bg-green-50 border-green-100'
            },
            {
              label: 'Shared Goals',
              sub: 'Push KPIs to employees',
              path: '/admin/shared-goals',
              color: 'bg-purple-50 border-purple-100'
            },
            {
              label: 'Reports',
              sub: 'Export achievement data',
              path: '/admin/reports',
              color: 'bg-yellow-50 border-yellow-100'
            },
            {
              label: 'Audit Log',
              sub: 'Track all changes',
              path: '/admin/audit',
              color: 'bg-red-50 border-red-100'
            },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`${item.color} border hover:opacity-80 rounded-xl p-5 text-left transition-all shadow-sm`}
            >
              <p className="font-semibold text-gray-800">{item.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
