export function formatDuration(inIso?: null | string, outIso?: null | string) {
  if (!inIso || !outIso) {
    return '';
  }
  const diffMs = new Date(outIso).getTime() - new Date(inIso).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return '';
  }
  const mins = Math.floor(diffMs / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
