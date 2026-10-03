import {mkdir, readFile, writeFile, rename, open, unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export const terminal = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export class TaskQueue {
  constructor(directory) { this.directory = directory; this.state = {offset: 0, tasks: [], outbox: []}; }
  async acquire() {
    await mkdir(this.directory, {recursive: true, mode: 0o700});
    try { this.lock = await open(join(this.directory, 'runner.lock'), 'wx', 0o600); }
    catch { throw new Error('QUEUE_LOCKED'); }
  }
  async release() {
    if (this.lock) { await this.lock.close(); await unlink(join(this.directory, 'runner.lock')); this.lock = null; }
  }
  async load({recover = true} = {}) {
    try { this.state = JSON.parse(await readFile(join(this.directory, 'queue.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('QUEUE_UNREADABLE'); }
    if (!Array.isArray(this.state.tasks) || !Array.isArray(this.state.outbox) || !Number.isInteger(this.state.offset)) throw new Error('QUEUE_UNREADABLE');
    // Never automatically repeat an interrupted task or a sensitive operation.
    for (const task of this.state.tasks) {
      if (recover && task.status === 'RUNNING') this.set(task, 'WAITING_FOR_USER', {service: 'SortTrip', action: 'Restart verification required'});
    }
  }
  async save() {
    const temporary = join(this.directory, 'queue.tmp');
    await writeFile(temporary, JSON.stringify(this.state, null, 2), {mode: 0o600});
    await rename(temporary, join(this.directory, 'queue.json'));
  }
  create(instruction) {
    const task = {id: `t-${randomUUID()}`, timestamp: new Date().toISOString(), instruction,
      status: 'QUEUED', source: 'telegram', progress: 0, result: null, error: null, resumeRequested: false};
    this.state.tasks.push(task);
    this.event('TASK_RECEIVED', task);
    return task;
  }
  event(kind, task, fields = {}) { this.state.outbox.push({kind, taskId: task?.id || null, ...fields}); }
  set(task, status, fields = {}) {
    Object.assign(task, fields, {status, updatedAt: new Date().toISOString()});
    if (status === 'RUNNING') { task.progress = 10; this.event('TASK_STARTED', task); }
    if (status === 'WAITING_FOR_USER') this.event('AUTH_REQUIRED', task, {service: task.service, action: task.action});
    if (status === 'COMPLETED') { task.progress = 100; this.event('TASK_COMPLETED', task, {summary: task.result}); }
    if (status === 'FAILED') this.event('TASK_FAILED', task, {summary: task.error});
    if (status === 'CANCELLED') this.event('TASK_CANCELLED', task);
  }
  active() { return this.state.tasks.find(t => t.status === 'RUNNING') || this.state.tasks.find(t => !terminal.has(t.status)); }
}
