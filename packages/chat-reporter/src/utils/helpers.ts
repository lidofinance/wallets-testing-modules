import axios from 'axios';

const GREEN = 47872;
const RED = 13959168;

export const testStatusToEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  skipped: '⏸️',
  interrupted: '❌',
  flaky: '🎲',
};

export const resultToStatus = {
  passed: { color: GREEN, title: '🧘 Completed!' },
  failed: { color: RED, title: `❌ Failed!` },
  timedout: { color: RED, title: `❌ Failed!` },
  interrupted: { color: RED, title: `❌ Failed!` },
};

export async function postJson(url: string, payload: any) {
  return axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  const resultH = h > 0 ? h + 'h ' : '';
  const resultM = m > 0 ? m + 'min ' : '';
  const resultS = (s % 60) + 'sec';

  return resultH + resultM + resultS;
}
