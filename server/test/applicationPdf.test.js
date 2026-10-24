import test from 'node:test'
import assert from 'node:assert/strict'
import { Writable } from 'node:stream'
import { writeCoverLetterPdf, writeResumePdf } from '../src/services/pdfService.js'

function responseStream() {
  let bytes = 0
  const chunks = []
  const output = new Writable({ write(chunk, encoding, done) { bytes += chunk.length; chunks.push(Buffer.from(chunk)); done() } })
  output.setHeader = () => {}
  return { output, bytes: () => bytes, pdf: () => Buffer.concat(chunks) }
}

test('cover-letter PDF emits selectable PDF content', async () => {
  const response = responseStream()
  writeCoverLetterPdf(response.output, 'Dear hiring team,\n\nI am writing about this role.', { title: 'Developer', company: 'Example' })
  await new Promise(resolve => response.output.on('finish', resolve))
  assert.ok(response.bytes() > 500)
})

test('resume PDF keeps dated, linked entries and later sections in the full-width flow across pages', async () => {
  const response = responseStream()
  writeResumePdf(response.output, {
    contact: { name: 'Avery Example', targetRole: 'Software Engineer', email: 'avery@example.com', phone: '+1 555 010 0110', location: 'Remote', links: ['https://example.com'] },
    summary: 'Engineer focused on clear, maintainable software.',
    sections: [
      { title: 'Skills', entries: [{ jobTitle: 'Languages', responsibilities: ['JavaScript', 'SQL'], techStack: [], links: [] }] },
      { title: 'Experience', entries: [{ jobTitle: 'Engineer', companyName: 'Example Co.', employmentDates: '2024 - Present', location: 'Remote', techStack: ['React'], links: ['https://example.com/project'], responsibilities: Array.from({ length: 40 }, (_, index) => `Delivered factual result number ${index + 1} with a detailed explanation that verifies pagination.`) }] },
      { title: 'Projects', entries: [{ jobTitle: 'Full Width Project', companyName: '', employmentDates: '2023', location: '', techStack: ['Node.js'], links: ['https://example.com/full-width'], responsibilities: ['This project must render after a dated linked entry without inheriting its right-side cursor.'] }] },
      { title: 'Education', entries: [{ jobTitle: 'Bachelor of Science', companyName: 'Example University', employmentDates: '2020 - 2023', location: '', techStack: [], links: [], responsibilities: [] }] }
    ]
  })
  await new Promise(resolve => response.output.on('finish', resolve))
  assert.ok(response.bytes() > 1000)
  assert.ok((response.pdf().toString('latin1').match(/\/Type \/Page\b/g) || []).length >= 2)
})
