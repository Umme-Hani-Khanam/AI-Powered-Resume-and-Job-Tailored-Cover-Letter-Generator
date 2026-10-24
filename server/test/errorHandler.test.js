import test from 'node:test'
import assert from 'node:assert/strict'
import { errorHandler, publicErrorMessage } from '../src/middleware/errorHandler.js'

test('maps provider and database errors to safe user-facing messages', () => {
  let statusCode
  let body
  const response = {
    status(code) { statusCode = code; return this },
    json(value) { body = value }
  }

  errorHandler(
    { code: 'PGRST205', message: "Could not find the table 'public.applications' in the schema cache" },
    { method: 'GET', originalUrl: '/api/applications' },
    response
  )

  assert.equal(statusCode, 500)
  assert.equal(body.error.message, 'We couldn’t complete that right now. Please try again shortly.')
  assert.equal(publicErrorMessage(429), 'Things are busy right now. Please try again shortly.')
  assert.equal(publicErrorMessage(504), 'That took too long. Please try again shortly.')
})
