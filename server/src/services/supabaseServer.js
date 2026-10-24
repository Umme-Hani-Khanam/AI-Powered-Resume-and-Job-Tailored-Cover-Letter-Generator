import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

function configError() { const error = new Error('Supabase server configuration is missing.'); error.status = 503; return error }
export function serverAuthClient() {
  if (!env.supabaseUrl || !env.supabaseKey) throw configError()
  return createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}
export async function requireUser(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: { message: 'Authentication is required.' } })
  try {
    const client = serverAuthClient()
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user) return res.status(401).json({ error: { message: 'Your session is invalid or expired.' } })
    req.auth = { user: data.user, token }
    next()
  } catch (error) { next(error) }
}
export function userClient(token) {
  const client = serverAuthClient()
  return createClient(env.supabaseUrl, env.supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}
