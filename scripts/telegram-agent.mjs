import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {TaskQueue} from './agent/queue.mjs';
import {handleUpdate} from './agent/controller.mjs';
import {runNext, verifyResume} from './agent/runner.mjs';
import {getUpdates} from './agent/transport.mjs';
import {flushNotifications} from './agent/notifications.mjs';
import {logEvent} from './agent/logging.mjs';
import {telegramConfigured} from './telegram-notify.mjs';
import {services, actions} from './agent/security.mjs';

const queue = new TaskQueue(resolve('.sorttrip-agent'));
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });

try {
  if (!telegramConfigured()) throw new Error('NOT_CONFIGURED');
  const [command, id, service, action] = process.argv.slice(2);
  if (!['list', 'show'].includes(command)) await queue.acquire();
  await queue.load({recover: !['list', 'show', 'claim', 'wait', 'complete', 'fail', 'resume-reviewed'].includes(command)});
  if (command === 'list') {
    console.log(JSON.stringify(queue.state.tasks.map(t => ({id: t.id, timestamp: t.timestamp, status: t.status, progress: t.progress, resumeRequested: t.resumeRequested}))));
  } else if (command === 'show') {
    const task = queue.state.tasks.find(t => t.id === id);
    if (!task) throw new Error('INVALID_TASK');
    // Local instruction display only; filtered at admission, never emitted to Telegram/logs.
    console.log(JSON.stringify({id: task.id, instruction: task.instruction, status: task.status, resumeRequested: task.resumeRequested}));
  } else if (['claim', 'wait', 'complete', 'fail', 'resume-reviewed'].includes(command)) {
    const task = queue.state.tasks.find(t => t.id === id);
    if (!task || ['COMPLETED','FAILED','CANCELLED'].includes(task.status)) throw new Error('INVALID_TASK');
    if (command === 'claim') {
      // This is an explicit LOCAL claim, not remote proof of authentication.
      if (task.status === 'WAITING_FOR_USER') throw new Error('VERIFY_APPLICATION_FIRST');
      if (queue.state.tasks.some(t => t.status === 'RUNNING' && t.id !== id)) throw new Error('RUNNER_BUSY');
      queue.set(task, 'RUNNING');
    }
    if (command === 'resume-reviewed') {
      // Local attestation only. The human/local Codex must inspect browser/application
      // state before invoking; the bridge cannot inspect it or infer it from Telegram.
      if (queue.state.tasks.some(t => t.status === 'RUNNING' && t.id !== id)) throw new Error('RUNNER_BUSY');
      if (!await verifyResume(queue, id, async () => service === 'application-state-verified')) throw new Error('VERIFY_APPLICATION_FIRST');
    }
    if (command === 'wait') {
      if (!services.has(service) || !actions.has(action)) throw new Error('INVALID_ACTION');
      queue.set(task, 'WAITING_FOR_USER', {service, action});
    }
    if (['complete', 'fail'].includes(command)) {
      if (task.status !== 'RUNNING') throw new Error('INVALID_TASK_STATE');
      queue.set(task, task.cancelRequested ? 'CANCELLED' : command === 'complete' ? 'COMPLETED' : 'FAILED', command === 'complete' ? {result: 'OWNER_VERIFIED_COMPLETE'} : {error: 'OWNER_VERIFIED_FAILED'});
    }
    await queue.save();
    if (!await flushNotifications(queue, process.env)) logEvent(task.id, 'NOTIFICATION_FAILED');
  } else if (command === 'poll' || !command) {
    logEvent(null, 'STARTED');
    do {
      const updates = await getUpdates(process.env, queue.state.offset);
      if (!updates) { logEvent(null, 'POLL_FAILED'); if (command === 'poll') break; await delay(5000); continue; }
      for (const update of updates.sort((a,b) => a.update_id - b.update_id)) handleUpdate(queue, update, process.env);
      await queue.save();
      if (!await flushNotifications(queue, process.env)) { logEvent(null, 'NOTIFICATION_FAILED'); if (command === 'poll') break; await delay(5000); continue; }
      await runNext(queue, {onStarted: async () => { if (!await flushNotifications(queue, process.env)) logEvent(null, 'NOTIFICATION_FAILED'); }});
      if (!await flushNotifications(queue, process.env)) logEvent(null, 'NOTIFICATION_FAILED');
    } while (!stopped && command !== 'poll');
    logEvent(null, 'STOPPED');
  } else throw new Error('INVALID_COMMAND');
} catch {
  console.log('Agent tidak dapat menjalankan operasi. Periksa konfigurasi, status task, dan lock lokal; detail sensitif disembunyikan.');
  process.exitCode = 1;
} finally { await queue.release(); }
