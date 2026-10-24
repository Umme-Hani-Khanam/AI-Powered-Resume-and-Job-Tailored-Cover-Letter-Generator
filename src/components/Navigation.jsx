import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import Logo from './Logo'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const logout = async () => { setBusy(true); try { await signOut(); navigate('/') } finally { setBusy(false) } }
  const link = ({ isActive }) => `text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-700'}`
  return <header className="border-b border-indigo-100 bg-white/85 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4"><Logo /><div className="flex items-center gap-3 sm:gap-4">{user ? <><NavLink to="/dashboard" className={link}>Home</NavLink><NavLink to="/resumes" className={link}>Resumes</NavLink><NavLink to="/applications" className={link}>Applications</NavLink><Button variant="secondary" onClick={logout} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</Button></> : <><Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-700">Log in</Link><Link to="/signup" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Get started</Link></>}</div></nav></header>
}
