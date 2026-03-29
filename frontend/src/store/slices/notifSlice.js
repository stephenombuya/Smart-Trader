import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationsAPI } from '@/utils/api'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const { data } = await notificationsAPI.list()
  return data
})

export const markRead = createAsyncThunk('notifications/markRead', async (id) => {
  await notificationsAPI.markRead(id)
  return id
})

const notifSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 },
  reducers: {
    addNotification: (state, { payload }) => {
      state.items.unshift(payload)
      if (!payload.is_read) state.unreadCount += 1
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.items       = payload.results
        state.unreadCount = payload.unread_count
      })
      .addCase(markRead.fulfilled, (state, { payload }) => {
        const n = state.items.find(i => i.id === payload)
        if (n && !n.is_read) { n.is_read = true; state.unreadCount = Math.max(0, state.unreadCount - 1) }
      })
  },
})

export const { addNotification } = notifSlice.actions
export default notifSlice.reducer
