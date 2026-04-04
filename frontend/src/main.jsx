import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import './styles/index.css'


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontFamily: 'DM Sans, sans-serif',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
              }}
          />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
