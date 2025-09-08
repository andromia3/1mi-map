export { toast } from "sonner";

export function toastRetry(message: string, retry: () => void, opts?: { description?: string }) {
  try {
    // @ts-ignore sonner action typing
    toast(message, {
      description: opts?.description,
      action: {
        label: 'Retry',
        onClick: () => {
          try { retry(); } catch {}
        },
      },
    });
  } catch {
    // noop
  }
}


