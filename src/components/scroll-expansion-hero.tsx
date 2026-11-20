import { useSyncExternalStore } from 'react';

const reducedQuery = '(prefers-reduced-motion: reduce)';
const compactQuery = '(max-width: 900px), (max-height: 600px)';
function subscribeCompact(callback: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
export function useHeroCompactLayout() {
  return useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => true);
}
function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
export function useHeroReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => true);
}
