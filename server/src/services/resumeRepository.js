import { userClient } from './supabaseServer.js'

export async function listResumes(token) { const { data, error } = await userClient(token).from('resumes').select('id,title,updated_at,created_at').order('updated_at', { ascending: false }); if (error) throw error; return data }
export async function getResume(token, id) { const { data, error } = await userClient(token).from('resumes').select('*').eq('id', id).maybeSingle(); if (error) throw error; return data }
export async function createResume(token, resume) { const { data, error } = await userClient(token).from('resumes').insert({ title: resume.contact.name ? `${resume.contact.name}'s resume` : 'Untitled resume', content: resume }).select().single(); if (error) throw error; return data }
export async function updateResume(token, id, resume, expectedUpdatedAt) {
  let query = userClient(token).from('resumes').update({ title: resume.contact.name ? `${resume.contact.name}'s resume` : 'Untitled resume', content: resume, updated_at: new Date().toISOString() }).eq('id', id)
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
  const { data, error } = await query.select().maybeSingle()
  if (error) throw error
  return data
}
