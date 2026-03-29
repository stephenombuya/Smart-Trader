import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { referralsAPI } from '@/utils/api'

export const fetchReferralTree = createAsyncThunk('referrals/tree', async () => {
  const { data } = await referralsAPI.getTree()
  return data
})

export const fetchTeamPerformance = createAsyncThunk('referrals/teamPerf', async () => {
  const { data } = await referralsAPI.getTeamPerf()
  return data
})

const referralsSlice = createSlice({
  name: 'referrals',
  initialState: { tree: null, teamPerf: null, loading: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchReferralTree.fulfilled,    (state, { payload }) => { state.tree     = payload })
      .addCase(fetchTeamPerformance.fulfilled, (state, { payload }) => { state.teamPerf = payload })
  },
})

export default referralsSlice.reducer
