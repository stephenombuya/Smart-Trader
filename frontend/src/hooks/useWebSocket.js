import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification } from '@/store/slices/notifSlice'
import toast from 'react-hot-toast'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function useNotificationSocket(isAuthenticated) {
  const dispatch = useDispatch()
  const wsRef    = useRef(null)
  const retryRef = useRef(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    function connect() {
      const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => { retryRef.current = 0 }

      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data)
          dispatch(addNotification({
            id:                msg.id || Date.now().toString(),
            notification_type: msg.type,
            title:             msg.title || 'Notification',
            message:           msg.message || '',
            is_read:           false,
            created_at:        new Date().toISOString(),
          }))
          // Pop a toast
          if (msg.type === 'withdrawal_success') toast.success(msg.message)
          else if (msg.type === 'commission')    toast.success(`💰 ${msg.message}`)
          else                                   toast(msg.message)
        } catch {}
      }

      ws.onclose = () => {
        if (retryRef.current < 5) {
          const delay = Math.min(1000 * 2 ** retryRef.current, 30000)
          retryRef.current += 1
          setTimeout(connect, delay)
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [isAuthenticated, dispatch])
}

export function useSpinSocket(onResult) {
  const wsRef = useRef(null)

  const connect = () => {
    const token = localStorage.getItem('access_token')
    const ws    = new WebSocket(`${WS_BASE}/ws/spin/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data)
        if (msg.type === 'spin_result') onResult(msg)
      } catch {}
    }
    return ws
  }

  const spin = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) connect()
    wsRef.current?.send(JSON.stringify({ type: 'spin_start' }))
  }

  useEffect(() => {
    const ws = connect()
    return () => ws.close()
  }, [])

  return { spin }
}
