import api from './axios'

export const getAllUsersApi = (params) => api.get('/admin/users', { params })
export const createUserApi = (data) => api.post('/admin/users', data)
export const updateUserApi = (userId, data) => api.put(`/admin/users/${userId}`, data)
export const deactivateUserApi = (userId) => api.delete(`/admin/users/${userId}`)
export const getAllSheetsApi = (params) => api.get('/admin/all-sheets', { params })
export const getCompletionStatsApi = (params) => api.get('/admin/completion-stats', { params })
export const getAuditLogsApi = (params) => api.get('/admin/audit-logs', { params })
export const getDepartmentsApi = () => api.get('/admin/departments')
export const getEmployeesApi = (params) => api.get('/admin/employees', { params })
