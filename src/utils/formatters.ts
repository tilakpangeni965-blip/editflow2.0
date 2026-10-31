import { Language } from '../types';

export const toNepaliNumerals = (num: number | string): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, (d) => nepaliDigits[parseInt(d, 10)]);
};

export const formatCurrency = (amountNpr: number, lang: Language): string => {
  const formattedNumber = amountNpr.toLocaleString('en-IN');
  if (lang === 'ne') {
    return `रु. ${toNepaliNumerals(formattedNumber)}`;
  }
  return `NPR ${formattedNumber}`;
};

export const formatTime = (seconds: number, lang: Language = 'ne'): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return lang === 'ne' ? toNepaliNumerals(formatted) : formatted;
};

export const formatTimeWithMillis = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
};

export const formatSrtTimestamp = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
};

export const formatVttTimestamp = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
};

export const formatFileSize = (bytes: number, lang: Language = 'ne'): string => {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  const str = `${mb.toFixed(1)} MB`;
  return lang === 'ne' ? `${toNepaliNumerals(mb.toFixed(1))} MB` : str;
};
