import test from 'node:test'
import assert from 'node:assert/strict'
import Ajv from 'ajv'
import { resumeSchema } from '../src/schemas/resumeSchema.js'
import { parseGeneratedResume } from '../src/services/aiResumeService.js'

const validResume = { contact: { name: '', targetRole: '', email: '', phone: '', location: '', links: [] }, summary: '', sections: [], ambiguities: [], suggestedClaims: [] }
test('resume schema accepts an intentionally empty, confirmation-first resume', () => {
  const validate = new Ajv({ allErrors: true }).compile(resumeSchema)
  assert.equal(validate(validResume), true)
})
test('resume schema rejects malformed AI output', () => {
  const validate = new Ajv({ allErrors: true }).compile(resumeSchema)
  assert.equal(validate({ contact: {}, summary: 'Invented fields are not accepted' }), false)
})
test('response processing rejects invalid AI JSON without returning a resume', () => {
  assert.throws(() => parseGeneratedResume('{not json}'), /invalid JSON/)
})
test('response processing accepts structured experience from a messy-text AI result', () => {
  const generated = { ...validResume, sections: [{ id: 'experience', title: 'Experience', entries: [{ id: 'internship', jobTitle: 'Software Intern', companyName: 'Bright Labs', employmentDates: 'Jun 2023–Aug 2023', location: '', responsibilities: ['Resolved supplied UI bugs.', 'Wrote supplied API tests.'], links: [], techStack: [], reviewRequired: false }] }] }
  assert.equal(parseGeneratedResume(JSON.stringify(generated)).sections[0].entries[0].companyName, 'Bright Labs')
})
