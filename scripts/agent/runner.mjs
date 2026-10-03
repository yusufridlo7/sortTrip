// No shell, eval, exec, SQL, dynamic URLs, or model process is used by this runner.
const localHealthInstructions = new Set(['Periksa health lokal SortTrip', 'Check local SortTrip health']);

export async function runNext(queue, {fetcher = fetch, onStarted = async () => {}} = {}) {
  if (queue.state.tasks.some(t => t.status === 'RUNNING')) return;
  const task = queue.state.tasks.find(t => t.status === 'QUEUED');
  if (!task) return;
  queue.set(task, 'RUNNING');
  await queue.save();
  await onStarted();
  if (!localHealthInstructions.has(task.instruction)) {
    queue.set(task, 'WAITING_FOR_USER', {service: 'Codex', action: 'Local agent handoff required'});
    await queue.save(); return;
  }
  try {
    const page = await fetcher('http://127.0.0.1:5173/', {redirect: 'error', signal: AbortSignal.timeout(5000)});
    const response = await fetcher('http://127.0.0.1:5173/api/health', {redirect: 'error', signal: AbortSignal.timeout(5000)});
    const health = await response.json();
    if (!page.ok || !response.ok || health.ok !== true) throw new Error('LOCAL_HEALTH_FAILED');
    queue.set(task, task.cancelRequested ? 'CANCELLED' : 'COMPLETED', {result: 'LOCAL_HEALTH_OK'});
  } catch { queue.set(task, task.cancelRequested ? 'CANCELLED' : 'FAILED', {error: 'LOCAL_HEALTH_FAILED'}); }
  await queue.save();
}

// Only a local agent callback that actually inspects relevant application state may verify.
// Telegram /resume merely sets resumeRequested and NEVER calls this function.
export async function verifyResume(queue, taskId, verifyApplicationState) {
  const task = queue.state.tasks.find(t => t.id === taskId && t.status === 'WAITING_FOR_USER' && t.resumeRequested);
  if (!task) return false;
  let verified = false;
  try { verified = await verifyApplicationState(task); } catch { /* Remain waiting; no raw errors. */ }
  task.resumeRequested = false;
  if (verified === true) queue.set(task, 'RUNNING');
  else queue.set(task, 'WAITING_FOR_USER');
  await queue.save();
  return verified === true;
}
