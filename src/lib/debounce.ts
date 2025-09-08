export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delayMs: number) {
  let handle: any;
  return (...args: Parameters<T>) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delayMs);
  };
}


