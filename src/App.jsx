import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AuthForm from './components/AuthForm'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import ResumeWorkspacePage from './pages/ResumeWorkspacePage'
import ApplicationWorkspacePage from './pages/ApplicationWorkspacePage'

export default function App() { return <Routes><Route path="/" element={<LandingPage />} /><Route path="/signup" element={<AuthForm mode="signup" />} /><Route path="/login" element={<AuthForm mode="login" />} /><Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /><Route path="/resumes" element={<ProtectedRoute><ResumeWorkspacePage /></ProtectedRoute>} /><Route path="/applications" element={<ProtectedRoute><ApplicationWorkspacePage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
