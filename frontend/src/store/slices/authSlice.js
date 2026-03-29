import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI, usersAPI } from '@/utils/api'

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' })
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(userData)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Registration failed' })
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refresh = localStorage.getItem('refresh_token')
  try { await authAPI.logout({ refresh }) } catch {}
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
})

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await usersAPI.getProfile()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchWallet = createAsyncThunk('auth/fetchWallet', async (_, { rejectWithValue }) => {
  try {
    const { data } = await usersAPI.getWallet()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    wallet:  null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error:   null,
  },
  reducers: {
    clearError: state => { state.error = null },
    updateWalletBalance: (state, action) => {
      if (state.wallet) state.wallet.wallet_balance = action.payload
      if (state.user)   state.user.wallet_balance   = action.payload
    },
  },
  extraReducers: builder => {
    builder
      // login
      .addCase(loginUser.pending,   state => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading         = false
        state.isAuthenticated = true
        state.user            = payload.user
      })
      .addCase(loginUser.rejected,  (state, { payload }) => {
        state.loading = false
        state.error   = payload?.error || 'Login failed'
      })
      // register
      .addCase(registerUser.pending,   state => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, state => { state.loading = false })
      .addCase(registerUser.rejected,  (state, { payload }) => {
        state.loading = false
        state.error   = Object.values(payload || {}).flat().join(', ')
      })
      // logout
      .addCase(logoutUser.fulfilled, state => {
        state.user = null; state.wallet = null; state.isAuthenticated = false
      })
      // profile
      .addCase(fetchProfile.fulfilled, (state, { payload }) => { state.user = payload })
      // wallet
      .addCase(fetchWallet.fulfilled,  (state, { payload }) => { state.wallet = payload })
  },
})

export const { clearError, updateWalletBalance } = authSlice.actions
export default authSlice.reducer
