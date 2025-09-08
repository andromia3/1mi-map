// Lightweight analytics wrapper. No-ops if no keys/runtime.
// Supported env (optional): NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_UMAMI_WEBSITE_ID

type Props = Record<string, any> | undefined;

function hasPosthog() {
  return typeof window !== 'undefined' && (window as any).posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY;
}
function hasUmami() {
  return typeof window !== 'undefined' && (window as any).umami && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
}

export function track(event: string, props?: Props) {
  try {
    if (hasPosthog()) (window as any).posthog.capture(event, props || {});
    else if (hasUmami()) (window as any).umami.track(event);
    else if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${event}`, props || {});
    }
  } catch {}
}


