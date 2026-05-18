import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const pageTitles = {
  '/employee': 'Dashboard',
  '/employee/goals': 'My Goal Sheet',
  '/employee/checkin': 'Quarterly Check-in',
  '/manager': 'Dashboard',
  '/manager/approvals': 'Approval Queue',
  '/manager/checkins': 'Team Check-ins',
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/sheets': 'All Goal Sheets',
  '/admin/shared-goals': 'Shared Goals',
  '/admin/reports': 'Reports',
  '/admin/audit': 'Audit Log',
}

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const pageTitle = pageTitles[location.pathname] || 'Portal'

  const cycleYear = new Date().getFullYear()

  return (
    <header className="bg-white border-b border-gray-100 px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0">

      <div>
        <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          FY {cycleYear} Cycle
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700 leading-none">
            {user?.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {user?.department || 'No department'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
