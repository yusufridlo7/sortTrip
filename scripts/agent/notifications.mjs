import {notifyTelegram} from '../telegram-notify.mjs';
import {services, actions} from './security.mjs';

const summaries = {
  LOCAL_HEALTH_OK: 'Halaman utama dan API lokal merespons dengan baik.',
  LOCAL_HEALTH_FAILED: 'Smoke test lokal gagal. Periksa server di laptop.',
  OWNER_VERIFIED_COMPLETE: 'Pekerjaan selesai; hasil telah diperiksa di laptop.',
  OWNER_VERIFIED_FAILED: 'Pekerjaan gagal; detail tersedia untuk diperiksa di laptop.',
};

export function notification(event) {
  const id = /^t-[a-f0-9-]{36}$/.test(event.taskId || '') ? event.taskId : '—';
  switch (event.kind) {
    case 'TASK_RECEIVED': return `📥 SortTrip Agent\nTask diterima\nID: ${id}`;
    case 'TASK_STARTED': return `🤖 SortTrip Agent\nTask ${id} sedang dikerjakan.`;
    case 'AUTH_REQUIRED': return `🔐 SortTrip Agent — Action Required\nStatus: AUTH_REQUIRED\nTask: ${id}\nService: ${services.has(event.service) ? event.service : 'Other'}\nAction: ${actions.has(event.action) ? event.action : 'Sensitive approval required'}\nSilakan ambil alih laptop untuk menyelesaikannya.`;
    case 'TASK_COMPLETED': return `✅ SortTrip Agent\nStatus: TASK_COMPLETED\nTask ${id} selesai.\n${summaries[event.summary] || 'Hasil tersedia untuk diperiksa di laptop.'}`;
    case 'TASK_FAILED': return `❌ SortTrip Agent\nStatus: TASK_FAILED\nTask ${id} gagal.\n${summaries[event.summary] || 'Periksa detail di laptop.'}`;
    case 'TASK_CANCELLED': return `SortTrip Agent\nTask ${id} dibatalkan.`;
    case 'RESUME_REQUESTED': return `SortTrip Agent\nTask ${id}: pemeriksaan ulang diminta. Autentikasi belum dianggap berhasil.`;
    case 'STATUS': return `SortTrip Agent\nRunner: local-safe + manual Codex handoff\nTask: ${id}\nStatus: ${['QUEUED','RUNNING','WAITING_FOR_USER','COMPLETED','FAILED','CANCELLED','IDLE'].includes(event.status) ? event.status : 'IDLE'}\nProgress: ${Number.isInteger(event.progress) && event.progress >= 0 && event.progress <= 100 ? event.progress : 0}%`;
    case 'HELP': return 'SortTrip Agent\n/status\n/task <instruksi tanpa credential>\n/cancel [task-id]\n/resume <task-id>\n/help\nTask otomatis: /task Periksa health lokal SortTrip\nTask umum membutuhkan handoff di laptop. Jangan kirim secret atau data pribadi.';
    case 'REJECTED': return 'Instruksi ditolak. Gunakan teks pendek tanpa credential atau data sensitif.';
    case 'NOT_FOUND': return 'Task tidak tersedia atau command tidak valid.';
    case 'CANCEL_UNSAFE': return 'Task sedang berjalan. Pembatalan ditunda sampai titik aman; ambil alih laptop bila diperlukan.';
    default: return 'SortTrip Agent: periksa status di laptop.';
  }
}

export async function flushNotifications(queue, env, send = notifyTelegram) {
  while (queue.state.outbox.length) {
    const result = await send(notification(queue.state.outbox[0]), {env});
    if (!result.ok) return false;
    queue.state.outbox.shift();
    await queue.save();
  }
  return true;
}
