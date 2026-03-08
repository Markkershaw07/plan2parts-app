import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return true;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
