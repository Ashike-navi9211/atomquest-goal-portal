import { useEffect, useState } from 'react'
import {
  getAllSharedGoalsApi,
  createSharedGoalApi
} from '../../api/shared.api'
import { getEmployeesApi } from '../../api/admin.api'
import Layout from '../../components/common/Layout'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'
import { THRUST_AREAS, UOM_TYPES } from '../../constants'

const emptyForm = {
  department: '',
  thrustArea: '',
  title: '',
  description: '',
  uomType: '',
  target: '',
  primaryOwnerId: '',
  recipientIds: []
}

const SharedGoals = () => {
  const [sharedGoals, setSharedGoals] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sgRes, empRes] = await Promise.all([
        getAllSharedGoalsApi(),
        getEmployeesApi()
      ])
      setSharedGoals(sgRes.data.data || [])
      setEmployees(empRes.data.data || [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleRecipientToggle = (empId) => {
    setForm(p => ({
      ...p,
      recipientIds: p.recipientIds.includes(empId)
        ? p.recipientIds.filter(id => id !== empId)
        : [...p.recipientIds, empId]
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title || !form.uomType || !form.target || !form.thrustArea) {
      toast.error('Fill all required fields')
      return
    }
    if (form.recipientIds.length === 0) {
      toast.error('Select at least one recipient')
      return
    }
    setSaving(true)
    try {
      await createSharedGoalApi(form)
      toast.success('Shared goal pushed to employees')
      await fetchData()
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to push shared goal')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shared Goals</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Push departmental KPIs to multiple employees
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Push Shared Goal
          </button>
        </div>

        {/* create form */}
        {showForm && (
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Create & Push Shared Goal
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    Department
                  </label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Sales & Revenue"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Goal Title (read-only for recipients)
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Department Revenue Target Q1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
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
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Target (read-only for recipients)
                  </label>
                  <input
                    name="target"
                    value={form.target}
                    onChange={handleChange}
                    placeholder="e.g. 10000000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* recipients */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Select Recipients ({form.recipientIds.length} selected)
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {employees.map(emp => (
                    <label
                      key={emp._id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.recipientIds.includes(emp._id)}
                        onChange={() => handleRecipientToggle(emp._id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{emp.name}</span>
                      <span className="text-xs text-gray-400">
                        {emp.department}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* primary owner */}
              {form.recipientIds.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Primary Owner (whose achievement syncs to others)
                  </label>
                  <select
                    name="primaryOwnerId"
                    value={form.primaryOwnerId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select primary owner</option>
                    {employees
                      .filter(e => form.recipientIds.includes(e._id))
                      .map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? 'Pushing...' : 'Push to Employees'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm) }}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* shared goals list */}
        {sharedGoals.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl py-16 text-center text-sm text-gray-400">
            No shared goals pushed yet
          </div>
        ) : (
          <div className="space-y-4">
            {sharedGoals.map((sg, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{sg.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sg.thrustArea} · {sg.department} ·
                      Target: {sg.target} ·
                      UoM: {sg.uomType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Pushed by {sg.createdBy?.name}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Recipients ({sg.recipients?.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sg.recipients?.map((r, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.isLinked
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.employee?.name || 'Unknown'}
                        {sg.primaryOwner?.toString() === r.employee?._id?.toString()
                          ? ' (owner)'
                          : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SharedGoals
