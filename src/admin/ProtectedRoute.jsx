import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthChange } from '../firebase/auth'

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) {
    return (
      <div style={{ backgroundColor: '#00', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />
  return children
}