import { Router } from 'express'
import { organizeResume } from '../services/aiResumeService.js'
import { createResume, getResume, listResumes, updateResume } from '../services/resumeRepository.js'
import { writeResumePdf } from '../services/pdfService.js'
import { resumeSchema } from '../schemas/resumeSchema.js'
import Ajv from 'ajv'

const router = Router(); const validate = new Ajv({ allErrors: true }).compile(resumeSchema)
function validateResume(req, res, next) { if (!validate(req.body.resume)) return res.status(400).json({ error: { message: 'Please check the resume details and try again.' } }); next() }
router.get('/', async (req, res, next) => { try { res.json({ resumes: await listResumes(req.auth.token) }) } catch (error) { next(error) } })
router.get('/:id', async (req, res, next) => { try { const resume = await getResume(req.auth.token, req.params.id); if (!resume) return res.status(404).json({ error: { message: 'Resume not found.' } }); res.json({ resume }) } catch (error) { next(error) } })
router.post('/organize', async (req, res, next) => { const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''; if (!text) return res.status(400).json({ error: { message: 'Paste some career information before organizing it.' } }); if (text.length > 30000) return res.status(413).json({ error: { message: 'Please keep pasted information under 30,000 characters.' } }); try { res.json({ resume: await organizeResume(text) }) } catch (error) { next(error) } })
router.post('/', validateResume, async (req, res, next) => { try { res.status(201).json({ resume: await createResume(req.auth.token, req.body.resume) }) } catch (error) { next(error) } })
router.put('/:id', validateResume, async (req, res, next) => { try { const expectedUpdatedAt = typeof req.body.expectedUpdatedAt === 'string' ? req.body.expectedUpdatedAt : ''; const resume = await updateResume(req.auth.token, req.params.id, req.body.resume, expectedUpdatedAt); if (!resume) return res.status(expectedUpdatedAt ? 409 : 404).json({ error: { message: expectedUpdatedAt ? 'This resume changed elsewhere. Reopen it before saving to avoid overwriting newer edits.' : 'Resume not found.' } }); res.json({ resume }) } catch (error) { next(error) } })
router.post('/pdf', validateResume, (req, res, next) => { try { writeResumePdf(res, req.body.resume) } catch (error) { next(error) } })
export default router
