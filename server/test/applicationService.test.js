import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationInsertFields, applicationUpdateFields, generationPrompt, parseGeminiJson } from '../src/services/applicationService.js'

const job = { title: 'Developer', company: 'Example', responsibilities: [], requiredSkills: [], preferredSkills: [] }
const resume = {
  contact: { name: 'Avery Example', targetRole: 'Developer', email: '', phone: '', location: '', links: [] },
  summary: '', sections: [], ambiguities: [], suggestedClaims: []
}

test('application persistence accepts either independently generated document', () => {
  const resumeOnly = applicationInsertFields('source-resume-id', { job, tailoredResume: resume })
  const coverOnly = applicationInsertFields('source-resume-id', { job, coverLetter: 'Dear hiring team,' })

  assert.deepEqual(resumeOnly.tailored_resume, resume)
  assert.equal(resumeOnly.cover_letter, '')
  assert.equal(coverOnly.tailored_resume, null)
  assert.equal(coverOnly.cover_letter, 'Dear hiring team,')
})

test('application updates patch only the selected document', () => {
  const resumePatch = applicationUpdateFields({ job, tailoredResume: resume })
  const coverPatch = applicationUpdateFields({ job, coverLetter: 'Updated letter.' })

  assert.deepEqual(resumePatch.tailored_resume, resume)
  assert.equal(Object.hasOwn(resumePatch, 'cover_letter'), false)
  assert.equal(coverPatch.cover_letter, 'Updated letter.')
  assert.equal(Object.hasOwn(coverPatch, 'tailored_resume'), false)
})

test('generation prompts request only the selected document', () => {
  const resumePrompt = generationPrompt(resume, 'Example job text', 'resume')
  const coverPrompt = generationPrompt(resume, 'Example job text', 'cover letter')

  assert.match(resumePrompt, /tailoredResume/)
  assert.match(resumePrompt, /Do not return a cover letter/)
  assert.match(coverPrompt, /coverLetter/)
  assert.match(coverPrompt, /Do not return a tailored resume/)
})

test('Gemini JSON parsing accepts fenced JSON and rejects malformed output without fabricating a document', () => {
  assert.deepEqual(parseGeminiJson('```json\n{"job": {}}\n```'), { job: {} })
  assert.throws(() => parseGeminiJson('not JSON'), { status: 502 })
})
