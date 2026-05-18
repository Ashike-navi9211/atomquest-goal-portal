import { useEffect, useState } from 'react'
import {
  getMySheetApi
} from '../../api/goal.api'
import {
  getMyCheckinsApi,
  submitCheckinApi,
  updateCheckinApi
} from '../../api/checkin.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const QUARTERS = [
  { key: 'q1_checkin', label: 'Q1 Check-in (July)' },
  { key: 'q2_checkin', label: 'Q2 Check-in (October)' },
  { key: 'q3_checkin', label: 'Q3 Check-in (January)' },
  { key: 'q4_annual', label: 'Q4 / Annual (March)' }
]

const ScoreBar = ({ score }) => {
  if (score === null || score === undefined) return null
  const color =
    score >= 90 ? 'bg-green-500' :
    score >= 60 ? 'bg-yellow-400' :
    'bg-red-400'

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress Score</span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

const QuarterlyUpdate = () => {
  const [sheet, setSheet] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState('q1_checkin')
  const [submitting, setSubmitting] = useState(null) // goalId being submitted

  // form state per goal — keyed by goalId
  const [forms, setForms] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const sheetRes = await getMySheetApi()
      const s = sheetRes.data.data
      setSheet(s)

      if (s) {
        const checkinRes = await getMyCheckinsApi()
        const allCheckins = checkinRes.data.data || []
        setCheckins(allCheckins)

        // pre-fill forms with existing checkin data
        const initialForms = {}
        s.goals.forEach(goal => {
          const existing = allCheckins.find(
            c => c.goalId === goal._id.toString() &&
            c.quarter === activeQuarter
          )
          initialForms[goal._id] = {
            actualAchievement: existing?.actualAchievement || '',
            status: existing?.status || 'not_started'
          }
        })
        setForms(initialForms)
      }
    } catch {
      setSheet(null)
    } finally {
      setLoading(false)
    }
  }

  const handleQuarterChange = (quarter) => {
    setActiveQuarter(quarter)

    if (!sheet) return

    // update forms with existing checkin data for new quarter
    const updatedForms = {}
    sheet.goals.forEach(goal => {
      const existing = checkins.find(
        c => c.goalId === goal._id.toString() &&
        c.quarter === quarter
      )
      updatedForms[goal._id] = {
        actualAchievement: existing?.actualAchievement || '',
        status: existing?.status || 'not_started'
      }
    })
    setForms(updatedForms)
  }

  const handleFormChange = (goalId, field, value) => {
    setForms(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }))
  }

  const handleSubmitCheckin = async (goal) => {
    const formData = forms[goal._id]

    if (!formData?.actualAchievement) {
      toast.error('Please enter actual achievement')
      return
    }

    setSubmitting(goal._id)
    try {
      const existing = checkins.find(
        c => c.goalId === goal._id.toString() &&
        c.quarter === activeQuarter
      )

      if (existing) {
        await updateCheckinApi(existing._id, {
          actualAchievement: formData.actualAchievement,
          status: formData.status
        })
        toast.success('Check-in updated')
      } else {
        await submitCheckinApi({
          goalId: goal._id,
          actualAchievement: formData.actualAchievement,
          status: formData.status
        })
        toast.success('Check-in submitted')
      }

      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit check-in')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  if (!sheet) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500">No goal sheet found for this cycle.</p>
          <p className="text-sm text-gray-400 mt-1">
            Create and get your goal sheet approved first.
          </p>
        </div>
      </Layout>
    )
  }

  if (sheet.status !== 'approved') {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500 font-medium">
            Check-ins are only available after your goal sheet is approved.
          </p>
          <p className="text-sm text-gray-400 mt-1 capitalize">
            Current status: {sheet.status}
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">

        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quarterly Check-in
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Log your actual achievement against planned targets
          </p>
        </div>

        {/* quarter tabs */}
        <div className="flex gap-2 flex-wrap">
          {QUARTERS.map(q => (
            <button
              key={q.key}
              onClick={() => handleQuarterChange(q.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuarter === q.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* goals checkin cards */}
        <div className="space-y-4">
          {sheet.goals.map(goal => {
            const existingCheckin = checkins.find(
              c => c.goalId === goal._id.toString() &&
              c.quarter === activeQuarter
            )
            const formData = forms[goal._id] || {
              actualAchievement: '',
              status: 'not_started'
            }
            const isSubmitted = !!existingCheckin
            const isThisSubmitting = submitting === goal._id

            return (
              <div
                key={goal._id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                {/* goal info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-800">{goal.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {goal.thrustArea} · {goal.weightage}% weightage ·
                      UoM: {goal.uomType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSubmitted && (
                      <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                        Submitted
                      </span>
                    )}
                    <StatusBadge status={formData.status} />
                  </div>
                </div>

                {/* planned vs actual */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Planned Target</p>
                    <p className="text-lg font-bold text-gray-700">
                      {goal.target}
                    </p>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Actual Achievement</p>
                    <p className="text-lg font-bold text-primary-700">
                      {existingCheckin?.actualAchievement || '—'}
                    </p>
                  </div>
                </div>

                {/* score bar if submitted */}
                {existingCheckin && (
                  <ScoreBar score={existingCheckin.progressScore} />
                )}

                {/* manager comment */}
                {existingCheckin?.managerComment && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">Manager Comment</p>
                    <p className="text-sm text-blue-700 italic">
                      "{existingCheckin.managerComment}"
                    </p>
                  </div>
                )}

                {/* input form */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Actual Achievement
                        {goal.uomType === 'timeline' ? ' (YYYY-MM-DD)' : ''}
                      </label>
                      <input
                        type={goal.uomType === 'timeline' ? 'date' : 'text'}
                        value={formData.actualAchievement}
                        onChange={e =>
                          handleFormChange(goal._id, 'actualAchievement', e.target.value)
                        }
                        placeholder={
                          goal.uomType === 'zero'
                            ? 'Enter 0 for success'
                            : 'Enter actual value'
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={e =>
                          handleFormChange(goal._id, 'status', e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="on_track">On Track</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmitCheckin(goal)}
                    disabled={isThisSubmitting}
                    className="mt-3 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
                  >
                    {isThisSubmitting
                      ? 'Saving...'
                      : isSubmitted
                      ? 'Update Check-in'
                      : 'Submit Check-in'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </Layout>
  )
}

export default QuarterlyUpdate
