import api from './axios'

export const getAchievementReportApi = (params) => api.get('/reports/achievement', { params })
export const getManagerSummaryApi = (params) => api.get('/reports/manager-summary', { params })

// for file downloads we need direct window href
export const downloadExcelUrl = (params) => {
  const token = localStorage.getItem('token')
  const query = new URLSearchParams({ ...params, token }).toString()
  return `/api/reports/export-excel?${query}`
}

export const downloadCsvUrl = (params) => {
  const token = localStorage.getItem('token')
  const query = new URLSearchParams({ ...params, token }).toString()
  return `/api/reports/export-csv?${query}`
}
