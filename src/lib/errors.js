export function friendlyError(error) {
  const status = Number(error?.status)
  if (status === 401) return 'Your session has ended. Please log in again.'
  if (status === 403) return 'You do not have access to that right now.'
  if (status === 409) return 'This changed elsewhere. Reopen it and try again.'
  if (status === 413) return 'That is a little too long. Trim it down and try again.'
  if (status === 429) return 'Things are busy right now. Please try again shortly.'
  if (status === 504) return 'That took too long. Please try again shortly.'
  if (status === 400) return 'Please check the details and try again.'
  return 'We couldn’t complete that right now. Please try again shortly.'
}
