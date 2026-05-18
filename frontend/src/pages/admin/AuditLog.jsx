import { useEffect, useState } from 'react'
import { getAuditLogsApi } from '../../api/admin.api'
import Layout from '../../components/common/Layout'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const ACTION_COLORS = {
  goal_approved: 'bg-green-100 text-green-700',
  goal_returned: 'bg-red-100 text-red-600',
  goal_unlocked: 'bg-orange-100 text-orange-600',
  goal_edited_after_lock: 'bg-yellow-100 text-yellow-700',
  sheet_submitted: 'bg-blue-100 text-blue-600',
  checkin_submitted: 'bg-primary-100 text-primary-600',
  checkin_commented: 'bg-purple-100 text-purple-600',
  shared_goal_pushed: 'bg-gray-100 text-gray-600'
}

const AuditLog = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (actionFilter) params.action = actionFilter
      const res = await getAuditLogsApi(params)
      setLogs(res.data.data || [])
    } catch {
      toast.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All system changes — who changed what and when
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActionFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              !actionFilter
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            All
          </button>
          {Object.keys(ACTION_COLORS).map(action => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                actionFilter === action
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {action.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No audit logs found
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map((log, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-start gap-4">
                    <div className="shrink-0 pt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        By: {log.changedBy?.name} ({log.changedBy?.role})
                        {log.employee && ` · Employee: ${log.employee?.name}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-gray-400 text-right">
                      {new Date(log.createdAt).toLocaleDateString()}
                      <br />
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuditLog
