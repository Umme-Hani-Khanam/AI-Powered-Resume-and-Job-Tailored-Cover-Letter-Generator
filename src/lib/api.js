import { supabase } from './supabase'
import { friendlyError } from './errors'
const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
export async function api(path, options = {}) {
  const { data } = await supabase.auth.getSession(); const token = data.session?.access_token
  if (!token) { const error = new Error('Your session has ended. Please log in again.'); error.status = 401; throw error }
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
  } catch {
    const error = new Error('We couldn’t reach Resumate right now. Please try again shortly.')
    error.status = 0
    throw error
  }
  if (!response.ok) {
    const error = new Error(friendlyError({ status: response.status }))
    error.status = response.status
    throw error
  }
  return response
}
