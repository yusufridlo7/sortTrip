import {authorized, safeInstruction} from './security.mjs';

export function handleUpdate(queue, update, env) {
  if (!Number.isInteger(update.update_id) || update.update_id < queue.state.offset) return;
  queue.state.offset = update.update_id + 1;
  if (!authorized(update, env)) return;
  const text = update.message.text;
  if (!safeInstruction(text, env)) { queue.event('REJECTED'); return; }
  const match = text.trim().match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  const command = match?.[1]?.toLowerCase();
  const argument = match?.[2]?.trim();
  if (command === 'help') { queue.event('HELP'); return; }
  if (command === 'status') {
    const task = queue.active(); queue.event('STATUS', task, {status: task?.status || 'IDLE', progress: task?.progress || 0}); return;
  }
  if (command === 'cancel') {
    const task = argument ? queue.state.tasks.find(t => t.id === argument) : queue.active();
    if (!task || ['COMPLETED','FAILED','CANCELLED'].includes(task.status)) { queue.event('NOT_FOUND'); return; }
    if (task.status === 'RUNNING') { task.cancelRequested = true; queue.event('CANCEL_UNSAFE', task); return; }
    queue.set(task, 'CANCELLED'); return;
  }
  if (command === 'resume') {
    const task = queue.state.tasks.find(t => t.id === argument && t.status === 'WAITING_FOR_USER');
    if (!task) { queue.event('NOT_FOUND'); return; }
    task.resumeRequested = true;
    queue.event('RESUME_REQUESTED', task); return;
  }
  if (command && command !== 'task') { queue.event('NOT_FOUND'); return; }
  const instruction = command === 'task' ? argument : text.trim();
  if (!safeInstruction(instruction, env) || queue.state.tasks.filter(t => !['COMPLETED','FAILED','CANCELLED'].includes(t.status)).length >= 100) {
    queue.event('REJECTED'); return;
  }
  queue.create(instruction);
}
