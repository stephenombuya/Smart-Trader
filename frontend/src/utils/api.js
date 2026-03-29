import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach JWT token from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — auto-refresh token
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE}/api/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register:       data => api.post('/auth/register/', data),
  login:          data => api.post('/auth/login/', data),
  logout:         data => api.post('/auth/logout/', data),
  verifyEmail:    data => api.post('/auth/verify-email/', data),
  forgotPassword: data => api.post('/auth/forgot-password/', data),
  resetPassword:  data => api.post('/auth/reset-password/', data),
  changePassword: data => api.post('/auth/change-password/', data),
}

// Users
export const usersAPI = {
  getProfile:    ()     => api.get('/users/profile/'),
  updateProfile: data   => api.patch('/users/profile/', data),
  getWallet:     ()     => api.get('/users/wallet/'),
  getActivity:   params => api.get('/users/activity/', { params }),
  withdraw:      data   => api.post('/users/withdraw/', data),
}

// Earnings
export const earningsAPI = {
  getDashboard:     ()      => api.get('/earnings/dashboard/'),
  getAds:           ()      => api.get('/earnings/ads/'),
  startWatch:       adId    => api.post(`/earnings/ads/${adId}/start/`),
  completeWatch:    (wId, d) => api.post(`/earnings/ads/watch/${wId}/complete/`, d),
  getSpinConfig:    ()      => api.get('/earnings/spin/'),
  executeSpin:      data    => api.post('/earnings/spin/execute/', data),
  getSpinHistory:   ()      => api.get('/earnings/spin/history/'),
  getTasks:         ()      => api.get('/earnings/tasks/'),
  submitTask:       (id, d) => api.post(`/earnings/tasks/${id}/submit/`, d),
}

// Referrals
export const referralsAPI = {
  getTree:        () => api.get('/referrals/tree/'),
  getCommissions: () => api.get('/referrals/commissions/'),
  getTeamPerf:    () => api.get('/referrals/team-performance/'),
}

// Notifications
export const notificationsAPI = {
  list:    ()   => api.get('/notifications/'),
  markRead: id  => api.post(`/notifications/${id}/read/`),
}

// Admin
export const adminAPI = {
  getDashboard: ()         => api.get('/admin-panel/dashboard/'),
  getUser:      id         => api.get(`/admin-panel/users/${id}/`),
  updateUser:   (id, data) => api.patch(`/admin-panel/users/${id}/`, data),
  getPending:   ()         => api.get('/admin-panel/tasks/pending/'),
  reviewTask:   (id, data) => api.post(`/admin-panel/tasks/${id}/review/`, data),
  getReports:   params     => api.get('/admin-panel/reports/', { params }),
}

export default api
