// Logs deliberately exclude instructions, results, chat IDs, API bodies and exceptions.
export function logEvent(taskId, status) {
  const id = /^t-[a-f0-9-]{36}$/.test(taskId || '') ? taskId : null;
  const allowed = new Set(['QUEUED', 'RUNNING', 'WAITING_FOR_USER', 'COMPLETED', 'FAILED', 'CANCELLED',
    'POLL_FAILED', 'NOTIFICATION_FAILED', 'STARTED', 'STOPPED']);
  console.log(JSON.stringify({timestamp: new Date().toISOString(), taskId: id,
    status: allowed.has(status) ? status : 'FAILED'}));
}
