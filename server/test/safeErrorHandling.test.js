import test from 'node:test'
import assert from 'node:assert/strict'
import { publicErrorMessage } from '../src/middleware/errorHandler.js'

test('safe API messages never include provider details', () => {
  const message = publicErrorMessage(503)
  assert.equal(message, 'We couldn’t complete that right now. Please try again shortly.')
  assert.equal(/gemini|supabase|json|api key|stack/i.test(message), false)
})
