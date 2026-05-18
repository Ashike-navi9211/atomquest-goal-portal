import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getSheetByIdApi,
  approveSheetApi,
  returnSheetApi,
  managerEditGoalApi
} from '../../api/goal.api'
import { getSheetCheckinsApi } from '../../api/checkin.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const GoalReview = () => {
  const { sheetId } = useParams()
  const navigate = useNavigate()

  const [sheet, setSheet] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [returnComment, setReturnComment] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [acting, setActing] = useState(false)

  // inline edit state per goal
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [editForm, setEditForm] = useState({ target: '', weightage: '' })

  useEffect(() => {
    fetchData()
  }, [sheetId])

  const fetchData = async () => {
    try {
      const res = await getSheetByIdApi(sheetId)
      setSheet(res.data.data)
    } catch (err) {
      toast.error('Failed to load sheet')
    }
    try {
      const ci = await getSheetCheckinsApi(sheetId)
      setCheckins(ci.data.data || [])
    } catch {
      setCheckins([])
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!window.confirm('Approve this goal sheet? It will be locked for the employee.')) return
    setActing(true)
    try {
      await approveSheetApi(sheetId)
      toast.success('Goal sheet approved and locked')
      navigate('/manager/approvals')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    } finally {
      setActing(false)
    }
  }

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      toast.error('Please provide a reason for returning')
      return
    }
    setActing(true)
    try {
      await returnSheetApi(sheetId, returnComment)
      toast.success('Sheet returned for rework')
      navigate('/manager/approvals')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return sheet')
    } finally {
      setActing(false)
    }
  }

  const handleStartEdit = (goal) => {
    setEditingGoalId(goal._id)
    setEditForm({
      target: goal.target,
      weightage: goal.weightage.toString()
    })
  }

  const handleSaveEdit = async (goal) => {
    try {
      await managerEditGoalApi(sheetId, goal._id, {
        target: editForm.target,
        weightage: parseInt(editForm.weightage)
      })
      toast.success('Goal updated')
      setEditingGoalId(null)
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  if (loading) return <Layout><Loader /></Layout>
  if (!sheet) return <Layout><div className="p-6 text-gray-500">Sheet not found</div></Layout>

  const totalWeight = sheet.goals?.reduce((s, g) => s + g.weightage, 0) || 0
  const canAct = sheet.status === 'submitted'

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">

        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/manager/approvals')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-2 block"
            >
              ← Back to Queue
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Goal Review — {sheet.employee?.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sheet.employee?.department} · FY {sheet.cycleYear}
            </p>
          </div>
          <StatusBadge status={sheet.status} />
        </div>

        {/* goals table with inline edit */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Goals ({sheet.goals?.length}/8)
            </h2>
            <span className={`text-sm font-bold ${
              totalWeight === 100 ? 'text-green-600' : 'text-red-500'
            }`}>
              Total: {totalWeight}%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Thrust Area</th>
                  <th className="px-4 py-3 text-left">Goal Title</th>
                  <th className="px-4 py-3 text-left">UoM</th>
                  <th className="px-4 py-3 text-center">Target</th>
                  <th className="px-4 py-3 text-center">Weightage</th>
                  {canAct && <th className="px-4 py-3 text-center">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sheet.goals?.map((goal, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {goal.thrustArea}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {goal.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                      {goal.uomType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingGoalId === goal._id ? (
                        <input
                          value={editForm.target}
                          onChange={e =>
                            setEditForm(p => ({ ...p, target: e.target.value }))
                          }
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-xs text-center"
                        />
                      ) : (
                        <span className="text-gray-700">{goal.target}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingGoalId === goal._id ? (
                        <input
                          type="number"
                          value={editForm.weightage}
                          onChange={e =>
                            setEditForm(p => ({ ...p, weightage: e.target.value }))
                          }
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-center"
                        />
                      ) : (
                        <span className="font-semibold text-gray-700">
                          {goal.weightage}%
                        </span>
                      )}
                    </td>
                    {canAct && (
                      <td className="px-4 py-3 text-center">
                        {editingGoalId === goal._id ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleSaveEdit(goal)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingGoalId(null)}
                              className="text-xs border border-gray-300 px-2 py-1 rounded text-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(goal)}
                            className="text-xs text-primary-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* checkins if any */}
        {checkins.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Check-in History</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {checkins.map((ci, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {ci.quarter.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Target: {ci.plannedTarget} · Actual: {ci.actualAchievement}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {ci.progressScore !== null && (
                      <span className={`font-bold text-sm ${
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

        {/* approval actions */}
        {canAct && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Approval Decision</h2>

            {showReturnForm ? (
              <div className="space-y-3">
                <textarea
                  value={returnComment}
                  onChange={e => setReturnComment(e.target.value)}
                  rows={3}
                  placeholder="Explain what needs to be changed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReturn}
                    disabled={acting}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60"
                  >
                    {acting ? 'Returning...' : 'Confirm Return'}
                  </button>
                  <button
                    onClick={() => setShowReturnForm(false)}
                    className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={acting || totalWeight !== 100}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {acting ? 'Approving...' : 'Approve & Lock'}
                </button>
                <button
                  onClick={() => setShowReturnForm(true)}
                  className="border border-red-300 text-red-500 hover:bg-red-50 px-6 py-2.5 rounded-lg text-sm font-medium"
                >
                  Return for Rework
                </button>
              </div>
            )}

            {totalWeight !== 100 && (
              <p className="text-xs text-red-500">
                Cannot approve — total weightage is {totalWeight}%, must be 100%
              </p>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}

export default GoalReview
