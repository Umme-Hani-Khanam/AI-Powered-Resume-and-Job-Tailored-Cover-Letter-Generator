import { Router } from 'express'
import { generateCoverLetter, generateTailoredResume, getApplication, listApplications, saveApplication, updateApplication } from '../services/applicationService.js'
import { writeCoverLetterPdf, writeResumePdf } from '../services/pdfService.js'

const router = Router()

function generationInput(req, res) {
  const { resumeId, jobText } = req.body || {}
  if (typeof resumeId !== 'string' || typeof jobText !== 'string' || !jobText.trim()) {
    res.status(400).json({ error: { message: 'Select a saved resume and paste the job description.' } })
    return null
  }
  if (jobText.length > 30000) {
    res.status(413).json({ error: { message: 'Keep job text under 30,000 characters.' } })
    return null
  }
  return { resumeId, jobText: jobText.trim() }
}

router.get('/', async (req, res, next) => { try { res.json({ applications: await listApplications(req.auth.token) }) } catch (error) { next(error) } })
router.post('/tailor/resume', async (req, res, next) => {
  const input = generationInput(req, res)
  if (!input) return
  try { res.json({ application: await generateTailoredResume(req.auth.token, input.resumeId, input.jobText) }) } catch (error) { next(error) }
})
router.post('/tailor/cover-letter', async (req, res, next) => {
  const input = generationInput(req, res)
  if (!input) return
  try { res.json({ application: await generateCoverLetter(req.auth.token, input.resumeId, input.jobText) }) } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  const { resumeId, application } = req.body || {}
  if (typeof resumeId !== 'string') return res.status(400).json({ error: { message: 'Select the source resume before saving.' } })
  try { res.status(201).json({ application: await saveApplication(req.auth.token, resumeId, application) }) } catch (error) { next(error) }
})
router.get('/:id', async (req, res, next) => {
  try {
    const application = await getApplication(req.auth.token, req.params.id)
    if (!application) return res.status(404).json({ error: { message: 'Application not found.' } })
    res.json({ application })
  } catch (error) { next(error) }
})
router.put('/:id', async (req, res, next) => {
  try {
    const application = await updateApplication(req.auth.token, req.params.id, req.body.application, req.body.expectedUpdatedAt)
    if (!application) return res.status(req.body.expectedUpdatedAt ? 409 : 404).json({ error: { message: req.body.expectedUpdatedAt ? 'This application changed elsewhere. Reopen it before saving.' : 'Application not found.' } })
    res.json({ application })
  } catch (error) { next(error) }
})
router.post('/pdf/resume', async (req, res, next) => {
  try {
    if (!req.body.application?.tailoredResume) return res.status(400).json({ error: { message: 'Generate or add a tailored resume before downloading it.' } })
    writeResumePdf(res, req.body.application.tailoredResume)
  } catch (error) { next(error) }
})
router.post('/pdf/cover-letter', async (req, res, next) => {
  try {
    const application = req.body.application
    if (!application?.coverLetter) return res.status(400).json({ error: { message: 'Cover letter content is required.' } })
    writeCoverLetterPdf(res, application.coverLetter, application.job)
  } catch (error) { next(error) }
})

export default router
