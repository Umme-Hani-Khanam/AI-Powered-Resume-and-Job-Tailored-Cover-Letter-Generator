import PDFDocument from 'pdfkit'

const PAGE_MARGIN = 48
const NAVY = '#17365d'
const INK = '#1e293b'
const MUTED = '#526277'
const RULE = '#cbd5e1'
const LINK = '#1d4ed8'

const safeLink = value => {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

const safeEmailLink = value => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '') ? `mailto:${value}` : '')
const safePhoneLink = value => (/^[+\d][\d\s().-]{4,}$/.test(value || '') ? `tel:${value.replace(/[^+\d]/g, '')}` : '')
const columnLeft = doc => doc.page.margins.left
const columnWidth = doc => doc.page.width - doc.page.margins.left - doc.page.margins.right
const resetColumn = doc => { doc.x = columnLeft(doc) }

function ensureRoom(doc, height) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage()
  resetColumn(doc)
}

function writeLink(doc, label, href, options = {}) {
  const { x, y, lineBreak, ...textOptions } = options
  const settings = { ...textOptions, link: href || undefined, underline: Boolean(href) }
  doc.fillColor(href ? LINK : MUTED)
  if (typeof x === 'number' && typeof y === 'number') doc.text(label, x, y, settings)
  else doc.text(label, settings)
}

function writeInlineContacts(doc, contact) {
  const values = [
    contact.email && { label: contact.email, href: safeEmailLink(contact.email) },
    contact.phone && { label: contact.phone, href: safePhoneLink(contact.phone) },
    contact.location && { label: contact.location, href: '' },
    ...(contact.links || []).map(link => ({ label: link, href: safeLink(link) }))
  ].filter(Boolean)
  const left = columnLeft(doc)
  const right = doc.page.width - doc.page.margins.right
  const lineHeight = doc.currentLineHeight()
  let x = left
  let y = doc.y

  for (const value of values) {
    const width = doc.widthOfString(value.label)
    const separator = x === left ? 0 : doc.widthOfString('  |  ')
    if (x !== left && x + separator + width > right) {
      x = left
      y += lineHeight + 2
    }
    if (x !== left) {
      doc.fillColor(MUTED).text('  |  ', x, y, { lineBreak: false })
      x += separator
    }
    writeLink(doc, value.label, value.href, { x, y })
    x += width
  }
  doc.y = y + lineHeight + 3
  resetColumn(doc)
}

function sectionHeading(doc, title) {
  // Reserve a heading plus the start of an entry so a heading is never orphaned.
  ensureRoom(doc, 96)
  doc.moveDown(0.65)
  const y = doc.y
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY).text(String(title || '').toUpperCase(), columnLeft(doc), y, { width: columnWidth(doc), characterSpacing: 0.4 })
  const ruleY = y + 16
  doc.moveTo(columnLeft(doc), ruleY).lineTo(doc.page.width - doc.page.margins.right, ruleY).lineWidth(0.55).strokeColor(RULE).stroke()
  doc.y = ruleY + 7
  resetColumn(doc)
}

function entryHeading(doc, item) {
  const left = columnLeft(doc)
  const width = columnWidth(doc)
  const title = item.jobTitle || item.companyName || ''
  const dates = item.employmentDates || ''
  const titleWidth = dates ? width - 130 : width
  const y = doc.y
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(title, left, y, { width: titleWidth, lineBreak: false })
  const titleHeight = doc.heightOfString(title, { width: titleWidth })
  if (dates) doc.font('Helvetica').fontSize(8.7).fillColor(MUTED).text(dates, left + width - 126, y, { width: 126, align: 'right' })
  doc.y = y + Math.max(titleHeight, doc.currentLineHeight()) + 1

  const details = [item.companyName && item.companyName !== title ? item.companyName : '', item.location].filter(Boolean).join('  |  ')
  if (details) {
    doc.font('Helvetica').fontSize(8.7).fillColor(MUTED).text(details, left, doc.y, { width })
    doc.moveDown(0.05)
  }
  resetColumn(doc)
}

function writeSkills(doc, entries) {
  for (const item of entries) {
    const skills = [...(item.responsibilities || []), ...(item.techStack || [])].filter(Boolean)
    if (!skills.length && !item.jobTitle) continue
    const label = item.jobTitle || 'Skills'
    const body = skills.join(', ')
    const width = columnWidth(doc)
    ensureRoom(doc, doc.heightOfString(`${label}: ${body}`, { width }) + 5)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.4).fillColor(INK).text(`${label}: `, columnLeft(doc), y, { continued: true, width })
    doc.font('Helvetica').fillColor(INK).text(body || '')
    resetColumn(doc)
  }
}

function writeEntry(doc, item) {
  const bullets = (item.responsibilities || []).filter(Boolean)
  const width = columnWidth(doc)
  const estimate = 46 + bullets.reduce((height, bullet) => height + doc.heightOfString(bullet, { width: width - 14 }), 0) + (item.techStack?.length ? 16 : 0) + (item.links?.length ? 15 : 0)
  ensureRoom(doc, estimate)
  entryHeading(doc, item)

  if (item.techStack?.length) {
    doc.font('Helvetica').fontSize(8.7).fillColor(MUTED).text(`Tech: ${item.techStack.join(', ')}`, columnLeft(doc), doc.y, { width })
    resetColumn(doc)
  }
  for (const link of item.links || []) {
    const href = safeLink(link)
    if (href) writeLink(doc, link, href, { x: columnLeft(doc), y: doc.y, width })
    resetColumn(doc)
  }
  for (const bullet of bullets) {
    ensureRoom(doc, doc.heightOfString(bullet, { width: width - 14 }) + 12)
    const y = doc.y
    doc.font('Helvetica').fontSize(9.3).fillColor(INK).text('•', columnLeft(doc), y, { width: 10, lineBreak: false })
    doc.text(bullet, columnLeft(doc) + 14, y, { width: width - 14, paragraphGap: 2 })
    resetColumn(doc)
  }
  doc.moveDown(0.25)
  resetColumn(doc)
}

function addPageNumbers(doc) {
  const range = doc.bufferedPageRange()
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index)
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(
      `Resumate  |  ${index + 1} of ${range.count}`,
      PAGE_MARGIN,
      doc.page.height - 31,
      { width: doc.page.width - PAGE_MARGIN * 2, align: 'right', lineBreak: false }
    )
  }
}

export function writeResumePdf(res, resume) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true, info: { Title: 'Resumate Resume' } })
  const contact = resume?.contact || {}
  const name = contact.name || 'resume'
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-')}.pdf"`)
  doc.pipe(res)

  doc.font('Helvetica-Bold').fontSize(23).fillColor(NAVY).text(name)
  if (contact.targetRole) doc.font('Helvetica').fontSize(11).fillColor(INK).text(contact.targetRole)
  doc.moveDown(0.22)
  doc.font('Helvetica').fontSize(8.7).fillColor(MUTED)
  writeInlineContacts(doc, contact)
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).lineWidth(1).strokeColor(NAVY).stroke()
  doc.moveDown(0.3)
  resetColumn(doc)

  if (resume?.summary) {
    sectionHeading(doc, 'Professional Summary')
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(resume.summary, columnLeft(doc), doc.y, { width: columnWidth(doc), paragraphGap: 3 })
    resetColumn(doc)
  }
  for (const section of resume?.sections || []) {
    if (!section.entries?.length) continue
    sectionHeading(doc, section.title)
    if (section.title.toLowerCase() === 'skills') writeSkills(doc, section.entries)
    else for (const item of section.entries) writeEntry(doc, item)
  }

  addPageNumbers(doc)
  doc.end()
}

export function writeCoverLetterPdf(res, letter, job = {}) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true, info: { Title: 'Resumate Cover Letter' } })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="resumate-cover-letter.pdf"')
  doc.pipe(res)
  doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY).text('Cover Letter')
  if (job.title || job.company) doc.font('Helvetica').fontSize(10).fillColor(MUTED).text([job.title, job.company].filter(Boolean).join('  |  '))
  doc.moveDown(0.35)
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).lineWidth(1).strokeColor(NAVY).stroke()
  doc.moveDown(0.8)
  resetColumn(doc)
  doc.font('Helvetica').fontSize(10.2).fillColor(INK).text(letter || '', columnLeft(doc), doc.y, { width: columnWidth(doc), paragraphGap: 9, lineGap: 1 })
  addPageNumbers(doc)
  doc.end()
}
