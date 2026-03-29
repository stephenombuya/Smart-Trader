import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { earningsAPI } from '@/utils/api'

export const fetchDashboard = createAsyncThunk('earnings/dashboard', async () => {
  const { data } = await earningsAPI.getDashboard()
  return data
})

export const fetchAds = createAsyncThunk('earnings/ads', async () => {
  const { data } = await earningsAPI.getAds()
  return data
})

export const fetchSpinConfig = createAsyncThunk('earnings/spinConfig', async () => {
  const { data } = await earningsAPI.getSpinConfig()
  return data
})

export const fetchTasks = createAsyncThunk('earnings/tasks', async () => {
  const { data } = await earningsAPI.getTasks()
  return data
})

const earningsSlice = createSlice({
  name: 'earnings',
  initialState: {
    dashboard: null,
    ads: [],
    spinConfig: null,
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => { state.dashboard = payload })
      .addCase(fetchAds.fulfilled,       (state, { payload }) => { state.ads = payload.results || payload })
      .addCase(fetchSpinConfig.fulfilled,(state, { payload }) => { state.spinConfig = payload })
      .addCase(fetchTasks.fulfilled,     (state, { payload }) => { state.tasks = payload.results || payload })
  },
})

export default earningsSlice.reducer
