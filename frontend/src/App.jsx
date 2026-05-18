import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// auth
import Login from './pages/auth/Login'

// employee
import EmployeeDashboard from './pages/employee/Dashboard'
import GoalSheet from './pages/employee/GoalSheet'
import QuarterlyUpdate from './pages/employee/QuarterlyUpdate'

// manager
import ManagerDashboard from './pages/manager/Dashboard'
import ApprovalQueue from './pages/manager/ApprovalQueue'
import GoalReview from './pages/manager/GoalReview'
import CheckInReview from './pages/manager/CheckInReview'

// admin
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import AllSheets from './pages/admin/AllSheets'
import AuditLog from './pages/admin/AuditLog'
import Reports from './pages/admin/Reports'
import SharedGoals from './pages/admin/SharedGoals'

// protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

// redirect logged in user to their dashboard by role
const RoleRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/employee" replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* employee routes */}
      <Route path="/employee" element={
        <ProtectedRoute roles={['employee']}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employee/goals" element={
        <ProtectedRoute roles={['employee']}>
          <GoalSheet />
        </ProtectedRoute>
      } />
      <Route path="/employee/checkin" element={
        <ProtectedRoute roles={['employee']}>
          <QuarterlyUpdate />
        </ProtectedRoute>
      } />

      {/* manager routes */}
      <Route path="/manager" element={
        <ProtectedRoute roles={['manager']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/manager/approvals" element={
        <ProtectedRoute roles={['manager']}>
          <ApprovalQueue />
        </ProtectedRoute>
      } />
      <Route path="/manager/review/:sheetId" element={
        <ProtectedRoute roles={['manager']}>
          <GoalReview />
        </ProtectedRoute>
      } />
      <Route path="/manager/checkins" element={
        <ProtectedRoute roles={['manager']}>
          <CheckInReview />
        </ProtectedRoute>
      } />

      {/* admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['admin']}>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/sheets" element={
        <ProtectedRoute roles={['admin']}>
          <AllSheets />
        </ProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <ProtectedRoute roles={['admin']}>
          <AuditLog />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute roles={['admin']}>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/admin/shared-goals" element={
        <ProtectedRoute roles={['admin']}>
          <SharedGoals />
        </ProtectedRoute>
      } />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
