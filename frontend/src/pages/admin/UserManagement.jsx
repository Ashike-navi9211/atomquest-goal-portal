import { useEffect, useState } from 'react'
import {
  getAllUsersApi,
  createUserApi,
  updateUserApi,
  deactivateUserApi
} from '../../api/admin.api'
import { getManagersApi } from '../../api/auth.api'
import Layout from '../../components/common/Layout'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '', email: '', password: '',
  role: 'employee', department: '', reportsTo: ''
}

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, managersRes] = await Promise.all([
        getAllUsersApi(),
        getManagersApi()
      ])
      setUsers(usersRes.data.data || [])
      setManagers(managersRes.data.data || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast.error('Name and email are required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateUserApi(editingId, form)
        toast.success('User updated')
      } else {
        if (!form.password) {
          toast.error('Password is required')
          setSaving(false)
          return
        }
        await createUserApi(form)
        toast.success('User created')
      }
      await fetchData()
      setForm(emptyForm)
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = user => {
    setEditingId(user._id)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      reportsTo: user.reportsTo?._id || ''
    })
    setShowForm(true)
  }

  const handleDeactivate = async userId => {
    if (!window.confirm('Deactivate this user?')) return
    try {
      await deactivateUserApi(userId)
      toast.success('User deactivated')
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <Layout><Loader /></Layout>

  const filtered = roleFilter === 'all'
    ? users
    : users.filter(u => u.role === roleFilter)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {users.length} total users
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Add User
          </button>
        </div>

        {/* create/edit form */}
        {showForm && (
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit User' : 'Create New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!!editingId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {form.role === 'employee' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Reports To (Manager)
                    </label>
                    <select
                      name="reportsTo"
                      value={form.reportsTo}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">No manager</option>
                      {managers.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} — {m.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* filters */}
        <div className="flex gap-2">
          {['all', 'employee', 'manager', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* users table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-center">Role</th>
                <th className="px-5 py-3 text-left">Reports To</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {user.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {user.department || '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {user.reportsTo?.name || '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Edit
                      </button>
                      {user.isActive && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeactivate(user._id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default UserManagement
