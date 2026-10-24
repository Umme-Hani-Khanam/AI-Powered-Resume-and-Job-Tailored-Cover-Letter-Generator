import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import Button from '../components/Button'
import { api } from '../lib/api'

const prettyResume = resume => resume ? JSON.stringify(resume, null, 2) : ''
const documentBaseline = application => ({ resume: application?.tailoredResume || null, cover: application?.coverLetter || '' })
const previewSkeleton = <div aria-label="Loading document preview" className="mt-3 animate-pulse space-y-3"><div className="h-5 w-2/5 rounded bg-slate-200" /><div className="h-4 w-full rounded bg-slate-100" /><div className="h-4 w-5/6 rounded bg-slate-100" /><div className="h-4 w-4/6 rounded bg-slate-100" /></div>

export default function ApplicationWorkspacePage() {
  const [resumes, setResumes] = useState([])
  const [resumeId, setResumeId] = useState('')
  const [jobText, setJobText] = useState('')
  const [application, setApplication] = useState(null)
  const [id, setId] = useState(null)
  const [updatedAt, setUpdatedAt] = useState('')
  const [saved, setSaved] = useState([])
  const [status, setStatus] = useState('')
  const [resumeJson, setResumeJson] = useState('')
  const [baseline, setBaseline] = useState(documentBaseline(null))
  const [loading, setLoading] = useState({ saved: true, resume: false, cover: false, saveResume: false, saveCover: false, pdfResume: false, pdfCover: false })

  const setLoadingKey = (key, value) => setLoading(current => ({ ...current, [key]: value }))

  const load = async () => {
    setLoadingKey('saved', true)
    const [resumesResult, applicationsResult] = await Promise.allSettled([
      api('/api/resumes').then(response => response.json()),
      api('/api/applications').then(response => response.json())
    ])
    if (resumesResult.status === 'fulfilled') {
      const nextResumes = resumesResult.value.resumes || []
      setResumes(nextResumes)
      setResumeId(currentId => currentId || nextResumes[0]?.id || '')
    }
    if (applicationsResult.status === 'fulfilled') setSaved(applicationsResult.value.applications || [])
    const failure = [resumesResult, applicationsResult].find(result => result.status === 'rejected')
    if (failure) setStatus(failure.reason.message)
    setLoadingKey('saved', false)
  }

  useEffect(() => { load() }, [])

  const resumeDraftDirty = resumeJson !== prettyResume(application?.tailoredResume)
  const dirty = Boolean(application && (
    JSON.stringify(application.tailoredResume || null) !== JSON.stringify(baseline.resume) ||
    application.coverLetter !== baseline.cover ||
    resumeDraftDirty
  ))
  useEffect(() => {
    const warnBeforeUnload = event => {
      if (dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    addEventListener('beforeunload', warnBeforeUnload)
    return () => removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  const generate = async documentType => {
    if (!resumeId || !jobText.trim()) {
      setStatus('Select a saved resume and paste the job description before generating.')
      return
    }
    const key = documentType === 'resume' ? 'resume' : 'cover'
    setLoadingKey(key, true)
    try {
      const response = await api(`/api/applications/tailor/${documentType === 'resume' ? 'resume' : 'cover-letter'}`, {
        method: 'POST',
        body: JSON.stringify({ resumeId, jobText })
      })
      const generated = (await response.json()).application
      setApplication(current => {
        const next = {
          job: generated.job || current?.job,
          tailoredResume: documentType === 'resume' ? generated.tailoredResume : current?.tailoredResume || null,
          coverLetter: documentType === 'cover' ? generated.coverLetter : current?.coverLetter || ''
        }
        if (!current) setBaseline(documentBaseline(null))
        return next
      })
      if (documentType === 'resume') setResumeJson(prettyResume(generated.tailoredResume))
      setStatus(`Tailored ${documentType === 'resume' ? 'resume' : 'cover letter'} ready to review.`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingKey(key, false)
    }
  }

  const parseResume = () => {
    try { return JSON.parse(resumeJson) } catch { setStatus('Resume JSON is invalid. Correct it before saving or downloading.'); return null }
  }

  const applyResume = () => {
    const tailoredResume = parseResume()
    if (!tailoredResume) return
    setApplication(current => ({ ...current, tailoredResume }))
    setStatus('Resume edits applied locally.')
  }

  const mergeSavedDocument = (savedApplication, documentType, localValue) => {
    setApplication(current => ({
      job: current?.job || savedApplication.job_details,
      tailoredResume: documentType === 'resume' ? savedApplication.tailored_resume : current?.tailoredResume || null,
      coverLetter: documentType === 'cover' ? savedApplication.cover_letter : current?.coverLetter || '',
    }))
    setId(savedApplication.id)
    setUpdatedAt(savedApplication.updated_at)
    setBaseline(current => ({ ...current, [documentType]: localValue }))
  }

  const saveDocument = async documentType => {
    if (!application?.job) return
    const key = documentType === 'resume' ? 'saveResume' : 'saveCover'
    const documentValue = documentType === 'resume' ? parseResume() : application.coverLetter
    if (documentValue === null) return
    setLoadingKey(key, true)
    try {
      const patch = documentType === 'resume'
        ? { job: application.job, tailoredResume: documentValue }
        : { job: application.job, coverLetter: documentValue }
      const response = await api(id ? `/api/applications/${id}` : '/api/applications', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(id ? { application: patch, expectedUpdatedAt: updatedAt } : { resumeId, application: patch })
      })
      const savedApplication = (await response.json()).application
      if (documentType === 'resume') setResumeJson(prettyResume(savedApplication.tailored_resume))
      mergeSavedDocument(savedApplication, documentType, documentValue)
      setStatus(`${documentType === 'resume' ? 'Tailored resume' : 'Cover letter'} saved.`)
      load()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingKey(key, false)
    }
  }

  const open = async applicationId => {
    if (dirty && !confirm('Discard unsaved edits and open another application?')) return
    try {
      const response = await api(`/api/applications/${applicationId}`)
      const value = (await response.json()).application
      const next = { job: value.job_details, tailoredResume: value.tailored_resume || null, coverLetter: value.cover_letter || '' }
      setApplication(next)
      setResumeJson(prettyResume(next.tailoredResume))
      setId(value.id)
      setUpdatedAt(value.updated_at)
      setBaseline(documentBaseline(next))
      setStatus('Application reopened.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const download = async documentType => {
    if (!application) return
    const key = documentType === 'resume' ? 'pdfResume' : 'pdfCover'
    let value = application
    if (documentType === 'resume') {
      const tailoredResume = parseResume()
      if (!tailoredResume) return
      value = { ...application, tailoredResume }
    }
    setLoadingKey(key, true)
    try {
      const response = await api(`/api/applications/pdf/${documentType === 'resume' ? 'resume' : 'cover-letter'}`, { method: 'POST', body: JSON.stringify({ application: value }) })
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = documentType === 'resume' ? 'resumate-tailored-resume.pdf' : 'resumate-cover-letter.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setStatus(`Could not create the PDF: ${error.message}`)
    } finally {
      setLoadingKey(key, false)
    }
  }

  return <>
    <Navigation />
    <main className="resumate-gradient px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-teal-700">Job tailoring</p>
        <h1 className="font-display text-3xl font-bold">Tailor each document independently.</h1>
        {status && <p role="status" className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{status}</p>}

        <section className="mt-6 rounded-2xl border bg-white p-5">
          <label>Saved resume
            <select value={resumeId} onChange={event => setResumeId(event.target.value)} className="mt-1 block w-full rounded-lg border p-2">
              {resumes.map(resume => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
            </select>
          </label>
          <label className="mt-4 block">Paste job description
            <textarea value={jobText} onChange={event => setJobText(event.target.value)} className="mt-1 min-h-44 w-full rounded-lg border p-3" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => generate('resume')} disabled={loading.resume || !resumeId}>{loading.resume ? 'Generating resume…' : 'Generate Tailored Resume'}</Button>
            <Button variant="secondary" onClick={() => generate('cover')} disabled={loading.cover || !resumeId}>{loading.cover ? 'Generating cover letter…' : 'Generate Cover Letter'}</Button>
          </div>
        </section>

        {(application || loading.resume || loading.cover) && <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article aria-busy={loading.resume} className="relative rounded-2xl border bg-white p-5">
            <h2 className="font-display text-xl font-bold">Tailored resume</h2>
            {application?.tailoredResume ? <textarea aria-label="Tailored resume JSON" value={resumeJson} onChange={event => setResumeJson(event.target.value)} className="mt-3 min-h-72 w-full rounded-lg border p-3 font-mono text-xs" /> : (loading.resume ? previewSkeleton : <p className="mt-3 text-sm text-slate-500">Generate a tailored resume to edit and download it.</p>)}
            {loading.resume && application?.tailoredResume && <div className="absolute inset-x-5 top-14 rounded-lg bg-white/75 p-3">{previewSkeleton}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={applyResume} disabled={!application?.tailoredResume || loading.resume}>Apply resume edits</Button>
              <Button onClick={() => saveDocument('resume')} disabled={!application?.tailoredResume || loading.saveResume}>{loading.saveResume ? 'Saving…' : 'Save Resume'}</Button>
              <Button variant="secondary" onClick={() => download('resume')} disabled={!application?.tailoredResume || loading.pdfResume}>{loading.pdfResume ? 'Preparing PDF…' : 'Download Resume PDF'}</Button>
            </div>
          </article>
          <article aria-busy={loading.cover} className="relative rounded-2xl border bg-white p-5">
            <h2 className="font-display text-xl font-bold">Cover letter</h2>
            {application?.coverLetter ? <textarea aria-label="Cover letter" value={application.coverLetter} onChange={event => setApplication(current => ({ ...current, coverLetter: event.target.value }))} className="mt-3 min-h-72 w-full rounded-lg border p-3" /> : (loading.cover ? previewSkeleton : <p className="mt-3 text-sm text-slate-500">Generate a cover letter to edit and download it.</p>)}
            {loading.cover && application?.coverLetter && <div className="absolute inset-x-5 top-14 rounded-lg bg-white/75 p-3">{previewSkeleton}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => saveDocument('cover')} disabled={!application?.coverLetter || loading.saveCover}>{loading.saveCover ? 'Saving…' : 'Save Cover Letter'}</Button>
              <Button variant="secondary" onClick={() => download('cover')} disabled={!application?.coverLetter || loading.pdfCover}>{loading.pdfCover ? 'Preparing PDF…' : 'Download Cover Letter PDF'}</Button>
            </div>
          </article>
        </section>}

        <section className="mt-6 rounded-2xl border bg-white p-5">
          <h2 className="font-display text-xl font-bold">Saved applications</h2>
          {loading.saved ? <div aria-label="Loading saved applications" className="mt-3 animate-pulse space-y-2"><div className="h-12 rounded-lg bg-slate-100" /><div className="h-12 rounded-lg bg-slate-100" /></div> : (saved.length ? saved.map(value => <button key={value.id} onClick={() => open(value.id)} className="mt-3 block w-full rounded-lg border p-3 text-left"><strong>{value.job_details?.title || 'Untitled role'}</strong>{value.job_details?.company && ` — ${value.job_details.company}`}<span className="ml-2 text-xs text-slate-500">Updated {new Date(value.updated_at).toLocaleDateString()}</span></button>) : <p className="mt-2 text-sm text-slate-500">No saved applications yet.</p>)}
        </section>
      </div>
    </main>
  </>
}
