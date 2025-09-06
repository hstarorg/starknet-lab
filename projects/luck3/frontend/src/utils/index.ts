import { formatDate as _formatDate } from 'date-fns';

const datePresetMap: Record<string, string> = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
};
export function formatDate(
  date: Date,
  presetOrFormat: 'date' | 'datetime' | string
): string {
  return _formatDate(date, datePresetMap[presetOrFormat] || presetOrFormat);
}

export function formatSTRK(amount: bigint) {
  const strk = Number(amount) / 1e18;
  return strk.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
