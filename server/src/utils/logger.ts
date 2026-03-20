// ============================================================
// PIXEL HEARTS — Logger
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, data?: any): void {
  if (LOG_LEVELS[level] < currentLevel) return;

  const entry = {
    timestamp: formatTimestamp(),
    level: level.toUpperCase(),
    message,
    ...(data ? { data } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (msg: string, data?: any) => log('debug', msg, data),
  info: (msg: string, data?: any) => log('info', msg, data),
  warn: (msg: string, data?: any) => log('warn', msg, data),
  error: (msg: string, data?: any) => log('error', msg, data),
};
