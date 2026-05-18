import api from './axios'

export const submitCheckinApi = (data) => api.post('/checkin/submit', data)
export const updateCheckinApi = (checkinId, data) => api.put(`/checkin/update/${checkinId}`, data)
export const getMyCheckinsApi = () => api.get('/checkin/my-checkins')
export const getTeamCheckinsApi = (quarter) => api.get('/checkin/team-checkins', { params: { quarter } })
export const getSheetCheckinsApi = (sheetId) => api.get(`/checkin/sheet-checkins/${sheetId}`)
export const addManagerCommentApi = (checkinId, comment) => api.put(`/checkin/comment/${checkinId}`, { comment })
