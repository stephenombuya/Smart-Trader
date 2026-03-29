import { configureStore } from '@reduxjs/toolkit'
import authReducer      from './slices/authSlice'
import earningsReducer  from './slices/earningsSlice'
import referralsReducer from './slices/referralsSlice'
import notifReducer     from './slices/notifSlice'

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    earnings:      earningsReducer,
    referrals:     referralsReducer,
    notifications: notifReducer,
  },
})
