const isProd = process.env.NODE_ENV === 'production';

function withGroup(level: 'info'|'warn'|'error', args: any[]) {
  if (isProd) return;
  try {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[${level}]`, ...args);
    // eslint-disable-next-line no-console
    console.trace();
    // eslint-disable-next-line no-console
    console.groupEnd();
  } catch {
    // noop
  }
}

export const log = {
  info: (...args: any[]) => { if (!isProd) { withGroup('info', args); } },
  warn: (...args: any[]) => { if (!isProd) { withGroup('warn', args); } },
  error: (...args: any[]) => { if (!isProd) { withGroup('error', args); } },
};


