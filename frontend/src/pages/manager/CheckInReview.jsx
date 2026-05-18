import { useEffect, useState } from 'react'
import { getTeamSheetsApi } from '../../api/goal.api'
import { getSheetCheckinsApi, addManagerCommentApi } from '../../api/checkin.api'
import Layout from '../../components/common/Layout'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const QUARTERS = [
  { key: 'q1_checkin', label: 'Q1' },
  { key: 'q2_checkin', label: 'Q2' },
  { key: 'q3_checkin', label: 'Q3' },
  { key: 'q4_annual', label: 'Q4 / Annual' }
]

const CheckInReview = () => {
  const [sheets, setSheets] = useState([])
  const [selectedSheet, setSelectedSheet] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCheckins, setLoadingCheckins] = useState(false)
  const [activeQuarter, setActiveQuarter] = useState('q1_checkin')
  const [comments, setComments] = useState({})
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    try {
      const res = await getTeamSheetsApi()
      const approved = (res.data.data || []).filter(s => s.status === 'approved')
      setSheets(approved)
      if (approved.length > 0) {
        setSelectedSheet(approved[0])
        fetchCheckins(approved[0]._id)
      }
    } catch {
      setSheets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckins = async (sheetId) => {
    setLoadingCheckins(true)
    try {
      const res = await getSheetCheckinsApi(sheetId)
      const all = res.data.data || []
      setCheckins(all)
      const initial = {}
      all.forEach(ci => { initial[ci._id] = ci.managerComment || '' })
      setComments(initial)
    } catch {
      setCheckins([])
    } finally {
      setLoadingCheckins(false)
    }
  }

  const handleSelectSheet = (sheet) => {
    setSelectedSheet(sheet)
    fetchCheckins(sheet._id)
  }

  const handleSaveComment = async (checkinId) => {
    if (!comments[checkinId]?.trim()) {
      toast.error('Comment cannot be empty')
      return
    }
    setSaving(checkinId)
    try {
      await addManagerCommentApi(checkinId, comments[checkinId])
      toast.success('Comment saved')
      await fetchCheckins(selectedSheet._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save comment')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  const filteredCheckins = checkins.filter(c => c.quarter === activeQuarter)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Check-ins</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View planned vs actual and add comments
          </p>
        </div>

        {sheets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
            No approved goal sheets found. Approve sheets first.
          </div>
        ) : (
          <div className="flex gap-6">

            {/* employee list sidebar */}
            <div className="w-52 shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 px-1">
                Team Members
              </p>
              <div className="space-y-1">
                {sheets.map(sheet => (
                  <button
                    key={sheet._id}
                    onClick={() => handleSelectSheet(sheet)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedSheet?._id === sheet._id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="truncate">{sheet.employee?.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {sheet.employee?.department}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* checkin detail */}
            <div className="flex-1 space-y-4">
              {selectedSheet && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">
                      {selectedSheet.employee?.name}
                    </h2>
                    {/* quarter tabs */}
                    <div className="flex gap-2">
                      {QUARTERS.map(q => (
                        <button
                          key={q.key}
                          onClick={() => setActiveQuarter(q.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            activeQuarter === q.key
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingCheckins ? (
                    <Loader text="Loading check-ins..." />
                  ) : filteredCheckins.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-sm text-gray-400">
                      No check-ins submitted for this quarter yet
                    </div>
                  ) : (
                    filteredCheckins.map(ci => (
                      <div
                        key={ci._id}
                        className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
                      >
                        {/* planned vs actual */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              Planned Target
                            </p>
                            <p className="text-lg font-bold text-gray-700">
                              {ci.plannedTarget}
                            </p>
                          </div>
                          <div className="bg-primary-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              Actual Achievement
                            </p>
                            <p className="text-lg font-bold text-primary-700">
                              {ci.actualAchievement || '—'}
                            </p>
                          </div>
                          <div className={`rounded-lg p-3 ${
                            ci.progressScore >= 90 ? 'bg-green-50' :
                            ci.progressScore >= 60 ? 'bg-yellow-50' :
                            'bg-red-50'
                          }`}>
                            <p className="text-xs text-gray-400 mb-1">
                              Progress Score
                            </p>
                            <p className={`text-lg font-bold ${
                              ci.progressScore >= 90 ? 'text-green-600' :
                              ci.progressScore >= 60 ? 'text-yellow-600' :
                              'text-red-500'
                            }`}>
                              {ci.progressScore ?? '—'}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 capitalize">
                            UoM: {ci.uomType?.replace(/_/g, ' ')}
                          </p>
                          <StatusBadge status={ci.status} />
                        </div>

                        {/* manager comment */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Manager Comment
                          </label>
                          <textarea
                            rows={2}
                            value={comments[ci._id] || ''}
                            onChange={e =>
                              setComments(p => ({
                                ...p,
                                [ci._id]: e.target.value
                              }))
                            }
                            placeholder="Add your feedback or observations..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          />
                          <button
                            onClick={() => handleSaveComment(ci._id)}
                            disabled={saving === ci._id}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60"
                          >
                            {saving === ci._id ? 'Saving...' : 'Save Comment'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CheckInReview
