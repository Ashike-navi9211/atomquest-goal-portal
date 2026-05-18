import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTeamSheetsApi } from '../../api/goal.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'

const ApprovalQueue = () => {
  const navigate = useNavigate()
  const [sheets, setSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('submitted')

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    try {
      const res = await getTeamSheetsApi()
      setSheets(res.data.data || [])
    } catch {
      setSheets([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  const filtered = filter === 'all'
    ? sheets
    : sheets.filter(s => s.status === filter)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and approve your team's goal sheets
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'approved', 'draft', 'returned'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f}
              {f !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({sheets.filter(s => s.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
            No sheets with status "{filter}"
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Employee</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-center">Goals</th>
                  <th className="px-5 py-3 text-center">Weightage</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Submitted</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((sheet, idx) => {
                  const totalWeight = sheet.goals?.reduce(
                    (s, g) => s + g.weightage, 0
                  ) || 0
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {sheet.employee?.name}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {sheet.employee?.department || '—'}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700">
                        {sheet.goals?.length}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={
                          totalWeight === 100
                            ? 'text-green-600 font-semibold'
                            : 'text-red-500 font-semibold'
                        }>
                          {totalWeight}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={sheet.status} />
                      </td>
                      <td className="px-5 py-3 text-center text-gray-400 text-xs">
                        {sheet.submittedAt
                          ? new Date(sheet.submittedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => navigate(`/manager/review/${sheet._id}`)}
                          className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg"
                        >
                          {sheet.status === 'submitted' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ApprovalQueue
