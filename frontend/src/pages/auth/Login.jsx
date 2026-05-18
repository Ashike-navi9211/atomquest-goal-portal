import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginApi } from '../../api/auth.api'
import toast from 'react-hot-toast'

const Login = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  // if already logged in redirect to role dashboard
  if (user) {
    if (user.role === 'admin') navigate('/admin')
    else if (user.role === 'manager') navigate('/manager')
    else navigate('/employee')
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      toast.error('Email and password are required')
      return
    }

    setLoading(true)
    try {
      const res = await loginApi(form)
      const { token, ...userData } = res.data.data
      login(userData, token)
      toast.success(`Welcome back, ${userData.name}`)

      if (userData.role === 'admin') navigate('/admin')
      else if (userData.role === 'manager') navigate('/manager')
      else navigate('/employee')

    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // quick fill for demo — saves time during hackathon presentation
  const demoCredentials = [
    { label: 'Admin', email: 'admin@atomquest.com', password: 'admin123' },
    { label: 'Manager', email: 'manager1@atomquest.com', password: 'manager123' },
    { label: 'Employee', email: 'emp1@atomquest.com', password: 'emp123' }
  ]

  const fillDemo = (cred) => {
    setForm({ email: cred.email, password: cred.password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">AtomQuest</h1>
          <p className="text-gray-500 mt-1 text-sm">Goal Setting & Tracking Portal</p>
        </div>

        {/* login card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* demo quick login — helpful during presentation */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">
              Quick login for demo
            </p>
            <div className="flex gap-2">
              {demoCredentials.map(cred => (
                <button
                  key={cred.label}
                  onClick={() => fillDemo(cred)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {cred.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 text-center mt-2">
              Click to fill credentials, then Sign In
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          AtomQuest Hackathon 1.0 — Internal Portal
        </p>
      </div>
    </div>
  )
}

export default Login
