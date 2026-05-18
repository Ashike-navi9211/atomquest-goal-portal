import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const employeeLinks = [
  { to: '/employee', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/employee/goals', label: 'My Goal Sheet', icon: '◎' },
  { to: '/employee/checkin', label: 'Quarterly Check-in', icon: '✓' }
]

const managerLinks = [
  { to: '/manager', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/manager/approvals', label: 'Approval Queue', icon: '◈' },
  { to: '/manager/checkins', label: 'Team Check-ins', icon: '✓' }
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/admin/users', label: 'User Management', icon: '◉' },
  { to: '/admin/sheets', label: 'All Goal Sheets', icon: '◎' },
  { to: '/admin/shared-goals', label: 'Shared Goals', icon: '◈' },
  { to: '/admin/reports', label: 'Reports', icon: '▤' },
  { to: '/admin/audit', label: 'Audit Log', icon: '◷' }
]

const Sidebar = () => {
  const { user } = useAuth()

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'manager' ? managerLinks :
    employeeLinks

  const roleLabel = {
    admin: 'Admin Panel',
    manager: 'Manager Panel',
    employee: 'Employee Panel'
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm">

      {/* logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">
              AtomQuest
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Goal Portal</p>
          </div>
        </div>
      </div>

      {/* role label */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {roleLabel[user?.role]}
        </p>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <span className="text-base w-4 text-center opacity-70">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* user info at bottom */}
      <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-600 text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

    </aside>
  )
}

export default Sidebar
