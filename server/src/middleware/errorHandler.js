export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'We could not find that request.' } })
}

export function publicErrorMessage(status) {
  if (status === 400) return 'Please check the details and try again.'
  if (status === 401) return 'Your session has ended. Please log in again.'
  if (status === 403) return 'You do not have access to that right now.'
  if (status === 404) return 'We could not find that.'
  if (status === 409) return 'This changed elsewhere. Reopen it and try again.'
  if (status === 413) return 'That is a little too long. Trim it down and try again.'
  if (status === 429) return 'Things are busy right now. Please try again shortly.'
  if (status === 504) return 'That took too long. Please try again shortly.'
  return 'We couldn’t complete that right now. Please try again shortly.'
}

export function errorHandler(error, req, res, next) {
  const status = Number(error?.status) || 500

  console.error(`${req.method} ${req.originalUrl} failed:`, {
    name: error?.name,
    code: error?.code,
    status,
  })
  res.status(status).json({ error: { message: publicErrorMessage(status) } })
}
