import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSheetsApi } from '../../api/admin.api'
import { unlockSheetApi } from '../../api/goal.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const AllSheets = () => {
  const navigate = useNavigate()
  const [sheets, setSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    try {
      const res = await getAllSheetsApi()
      setSheets(res.data.data || [])
    } catch {
      toast.error('Failed to load sheets')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (sheetId) => {
    if (!window.confirm('Unlock this sheet? Employee will be able to edit goals again.')) return
    try {
      await unlockSheetApi(sheetId)
      toast.success('Sheet unlocked')
      await fetchSheets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock')
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  const filtered = statusFilter === 'all'
    ? sheets
    : sheets.filter(s => s.status === statusFilter)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Goal Sheets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sheets.length} sheets across all employees
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'submitted', 'approved', 'returned'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                statusFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
              {f !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({sheets.filter(s => s.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Manager</th>
                <th className="px-5 py-3 text-center">Goals</th>
                <th className="px-5 py-3 text-center">Weightage</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Locked</th>
                <th className="px-5 py-3 text-center">Actions</th>
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
                    <td className="px-5 py-3 text-gray-500">
                      {sheet.manager?.name || '—'}
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
                    <td className="px-5 py-3 text-center">
                      {sheet.isLocked ? (
                        <span className="text-xs text-orange-500 font-medium">
                          Locked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {sheet.isLocked && (
                          <button
                            onClick={() => handleUnlock(sheet._id)}
                            className="text-xs text-orange-500 hover:underline"
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default AllSheets
