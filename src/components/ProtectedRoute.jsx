import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="grid min-h-screen place-items-center text-slate-600">Restoring your session…</main>
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />
}
