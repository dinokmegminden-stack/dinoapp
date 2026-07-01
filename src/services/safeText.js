export function safeText(value) {
  if (value == null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}
