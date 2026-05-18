import api from './axios'

export const createSharedGoalApi = (data) => api.post('/shared/create', data)
export const getAllSharedGoalsApi = () => api.get('/shared/all')
export const updateSharedWeightageApi = (sheetId, goalId, weightage) =>
  api.put(`/shared/update-weightage/${sheetId}/${goalId}`, { weightage })
export const syncAchievementApi = (sharedGoalId, actualAchievement) =>
  api.put(`/shared/sync-achievement/${sharedGoalId}`, { actualAchievement })
