import axios from 'axios';
import { RunInfo } from '../index';

const GREEN = 47872;
const RED = 13959168;
const ORANGE = 16753920;

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
  flaky: { color: ORANGE, title: '🏀 Flaked!' },
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
  const sec = s % 60;
  return `${h} hours ${m} minutes ${sec} seconds`;
}

export function getResultMessageStatus(runStatus: string, runInfo: RunInfo) {
  return runStatus == 'passed' && runInfo.testCount.flaky > 0
    ? resultToStatus['flaky']
    : resultToStatus[runStatus];
}
