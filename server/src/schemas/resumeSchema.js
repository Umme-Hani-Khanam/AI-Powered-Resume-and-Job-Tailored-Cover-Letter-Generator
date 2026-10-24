const text = { type: 'string' }
const entry = { type: 'object', additionalProperties: false, required: ['id', 'jobTitle', 'companyName', 'employmentDates', 'location', 'responsibilities', 'links', 'techStack', 'reviewRequired'], properties: { id: text, jobTitle: text, companyName: text, employmentDates: text, location: text, responsibilities: { type: 'array', items: text }, links: { type: 'array', items: text }, techStack: { type: 'array', items: text }, reviewRequired: { type: 'boolean' } } }
const section = { type: 'object', additionalProperties: false, required: ['id', 'title', 'entries'], properties: { id: text, title: text, entries: { type: 'array', items: entry } } }
export const resumeSchema = {
  type: 'object', additionalProperties: false, required: ['contact', 'summary', 'sections', 'ambiguities', 'suggestedClaims'],
  properties: {
    contact: { type: 'object', additionalProperties: false, required: ['name', 'targetRole', 'email', 'phone', 'location', 'links'], properties: { name: text, targetRole: text, email: text, phone: text, location: text, links: { type: 'array', items: text } } },
    summary: text, sections: { type: 'array', items: section }, ambiguities: { type: 'array', items: text }, suggestedClaims: { type: 'array', items: text },
  },
}
