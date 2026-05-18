import api from './axios'

export const getMySheetApi = () => api.get('/goals/my-sheet')
export const initSheetApi = () => api.post('/goals/init-sheet')
export const addGoalApi = (data) => api.post('/goals/add-goal', data)
export const updateGoalApi = (goalId, data) => api.put(`/goals/update-goal/${goalId}`, data)
export const removeGoalApi = (goalId) => api.delete(`/goals/remove-goal/${goalId}`)
export const submitSheetApi = () => api.post('/goals/submit')
export const getTeamSheetsApi = () => api.get('/goals/team-sheets')
export const getSheetByIdApi = (sheetId) => api.get(`/goals/sheet/${sheetId}`)
export const approveSheetApi = (sheetId) => api.put(`/goals/approve/${sheetId}`)
export const returnSheetApi = (sheetId, comment) => api.put(`/goals/return/${sheetId}`, { comment })
export const managerEditGoalApi = (sheetId, goalId, data) => api.put(`/goals/manager-edit/${sheetId}/${goalId}`, data)
export const unlockSheetApi = (sheetId) => api.put(`/goals/unlock/${sheetId}`)
