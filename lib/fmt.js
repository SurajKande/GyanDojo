// Turns a stored answer into readable text for the Review screen.
export function fmt(type, body, ans) {
  if (ans === null || ans === undefined) return '(skipped)';
  if (type === 'single' || type === 'scenario') return body.options[ans];
  if (type === 'multi' && Array.isArray(ans)) return ans.map(i => body.options[i]).join(' | ');
  if (type === 'arrange' && Array.isArray(ans)) return ans.map(i => body.lines[i]).join(' → ');
  if (Array.isArray(ans)) return ans.join(type === 'fill' ? ' / ' : ', ');
  return String(ans);
}
