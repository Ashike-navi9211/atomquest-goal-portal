import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getMySheetApi,
  initSheetApi,
  addGoalApi,
  updateGoalApi,
  removeGoalApi,
  submitSheetApi
} from '../../api/goal.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import WeightageBar from '../../components/common/WeightageBar'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'
import { THRUST_AREAS, UOM_TYPES } from '../../constants'

const emptyGoal = {
  thrustArea: '',
  title: '',
  description: '',
  uomType: '',
  target: '',
  weightage: ''
}

const GoalSheet = () => {
  const { user } = useAuth()

  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [form, setForm] = useState(emptyGoal)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSheet()
  }, [])

  const fetchSheet = async () => {
    try {
      const res = await getMySheetApi()
      setSheet(res.data.data)
    } catch {
      setSheet(null)
    } finally {
      setLoading(false)
    }
  }

  const handleInitSheet = async () => {
    try {
      const res = await initSheetApi()
      setSheet(res.data.data)
      toast.success('Goal sheet created')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sheet')
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()

    if (!form.thrustArea || !form.title || !form.uomType || !form.target || !form.weightage) {
      toast.error('All fields are required')
      return
    }

    const weightage = parseInt(form.weightage)
    if (isNaN(weightage) || weightage < 10) {
      toast.error('Minimum weightage is 10%')
      return
    }

    setSaving(true)
    try {
      if (editingGoalId) {
        await updateGoalApi(editingGoalId, { ...form, weightage })
        toast.success('Goal updated')
      } else {
        await addGoalApi({ ...form, weightage })
        toast.success('Goal added')
      }
      await fetchSheet()
      setForm(emptyGoal)
      setShowForm(false)
      setEditingGoalId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoalId(goal._id)
    setForm({
      thrustArea: goal.thrustArea,
      title: goal.title,
      description: goal.description || '',
      uomType: goal.uomType,
      target: goal.target,
      weightage: goal.weightage.toString()
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRemove = async (goalId) => {
    if (!window.confirm('Remove this goal?')) return
    try {
      await removeGoalApi(goalId)
      await fetchSheet()
      toast.success('Goal removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove goal')
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm('Submit this goal sheet for manager approval? You cannot edit after submission.')) return
    setSubmitting(true)
    try {
      await submitSheetApi()
      await fetchSheet()
      toast.success('Goal sheet submitted for approval')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setForm(emptyGoal)
    setEditingGoalId(null)
    setShowForm(false)
  }

  if (loading) return <Layout><Loader /></Layout>

  const isEditable = sheet && !sheet.isLocked &&
    sheet.status !== 'submitted' &&
    sheet.status !== 'approved'

  const totalWeightage = sheet?.goals?.reduce((s, g) => s + g.weightage, 0) || 0
  const canSubmit = isEditable && sheet?.goals?.length > 0 && totalWeightage === 100

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">

        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Goal Sheet</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              FY {new Date().getFullYear()} · {user?.name}
            </p>
          </div>
          {sheet && (
            <div className="flex items-center gap-3">
              <StatusBadge status={sheet.status} />
              {sheet.isLocked && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Locked
                </span>
              )}
            </div>
          )}
        </div>

        {/* return comment */}
        {sheet?.status === 'returned' && sheet.returnComment && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">
              Returned for rework
            </p>
            <p className="text-sm text-red-500 italic">
              "{sheet.returnComment}"
            </p>
          </div>
        )}

        {/* no sheet state */}
        {!sheet && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <p className="text-gray-500 text-sm mb-4">
              No goal sheet exists for this cycle yet
            </p>
            <button
              onClick={handleInitSheet}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Create Goal Sheet
            </button>
          </div>
        )}

        {/* weightage bar */}
        {sheet && sheet.goals.length > 0 && (
          <WeightageBar goals={sheet.goals} />
        )}

        {/* add goal form */}
        {sheet && isEditable && showForm && (
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              {editingGoalId ? 'Edit Goal' : 'Add New Goal'}
            </h2>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Thrust Area
                  </label>
                  <select
                    name="thrustArea"
                    value={form.thrustArea}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select area</option>
                    {THRUST_AREAS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    name="uomType"
                    value={form.uomType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select UoM</option>
                    {Object.entries(UOM_TYPES).map(([key, val]) => (
                      <option key={key} value={val}>
                        {val === 'numeric_min' ? 'Numeric (Higher is better)' :
                         val === 'numeric_max' ? 'Numeric (Lower is better)' :
                         val === 'timeline' ? 'Timeline (Date based)' :
                         'Zero (Zero = Success)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Achieve Q1 Sales Target"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief description of this goal"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Target {form.uomType === 'timeline' ? '(YYYY-MM-DD)' : ''}
                  </label>
                  <input
                    type={form.uomType === 'timeline' ? 'date' : 'text'}
                    name="target"
                    value={form.target}
                    onChange={handleChange}
                    placeholder={
                      form.uomType === 'numeric_min' ? 'e.g. 5000000' :
                      form.uomType === 'numeric_max' ? 'e.g. 5' :
                      form.uomType === 'zero' ? '0' : 'Enter target'
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Weightage (%) — min 10%
                  </label>
                  <input
                    type="number"
                    name="weightage"
                    value={form.weightage}
                    onChange={handleChange}
                    min="10"
                    max="100"
                    placeholder="e.g. 30"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Add Goal'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* goals table */}
        {sheet && sheet.goals.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Goals ({sheet.goals.length}/8)
              </h2>
              {isEditable && !showForm && sheet.goals.length < 8 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  + Add Goal
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Thrust Area</th>
                    <th className="px-4 py-3 text-left">Goal Title</th>
                    <th className="px-4 py-3 text-left">UoM</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-center">Weightage</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    {isEditable && (
                      <th className="px-4 py-3 text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sheet.goals.map((goal, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {goal.thrustArea}
                        {goal.isShared && (
                          <span className="ml-1 text-xs text-blue-500">(shared)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{goal.title}</p>
                        {goal.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                        {goal.uomType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {goal.target}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">
                        {goal.weightage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={goal.status} />
                      </td>
                      {isEditable && (
                        <td className="px-4 py-3 text-center">
                          {!goal.isReadOnly && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(goal)}
                                className="text-xs text-primary-600 hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleRemove(goal._id)}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {goal.isShared && goal.isReadOnly && (
                            <span className="text-xs text-gray-400">Read-only</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={isEditable ? 4 : 4} className="px-4 py-2" />
                    <td className="px-4 py-2 text-center font-bold text-sm">
                      <span className={totalWeightage === 100 ? 'text-green-600' : 'text-red-500'}>
                        {totalWeightage}%
                      </span>
                    </td>
                    <td colSpan={isEditable ? 2 : 1} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* empty goals state */}
        {sheet && sheet.goals.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              No goals added yet. Add your first goal.
            </p>
            {isEditable && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm"
              >
                + Add First Goal
              </button>
            )}
          </div>
        )}

        {/* action buttons */}
        {sheet && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-400">
              {sheet.isLocked
                ? 'Sheet is locked. Contact admin to unlock.'
                : sheet.status === 'submitted'
                ? 'Sheet submitted. Waiting for manager approval.'
                : sheet.status === 'approved'
                ? 'Sheet approved by manager.'
                : totalWeightage !== 100 && sheet.goals.length > 0
                ? `Total weightage must be 100%. Currently ${totalWeightage}%.`
                : ''}
            </div>

            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}

            {isEditable && !showForm && sheet.goals.length < 8 && sheet.goals.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="border border-primary-500 text-primary-600 hover:bg-primary-50 px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                + Add Another Goal
              </button>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}

export default GoalSheet
