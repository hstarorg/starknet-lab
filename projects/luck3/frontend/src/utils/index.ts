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
