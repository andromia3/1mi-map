export async function safeFetch<T>(fn: () => Promise<T>, opts?: { retries?: number; delayMs?: number; label?: string }): Promise<T> {
  const retries = opts?.retries ?? 2;
  const delayMs = opts?.delayMs ?? 200;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
    }
  }
  throw lastErr;
}


