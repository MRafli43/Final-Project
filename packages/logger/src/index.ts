type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export function createLogger(scope: string) {
  function log(level: LogLevel, message: string, ...details: unknown[]) {
    console[level](`[${new Date().toISOString()}] [${scope}] [${level}] ${message}`, ...details)
  }

  return {
    debug: (message: string, ...details: unknown[]) => log('debug', message, ...details),
    info: (message: string, ...details: unknown[]) => log('info', message, ...details),
    warn: (message: string, ...details: unknown[]) => log('warn', message, ...details),
    error: (message: string, ...details: unknown[]) => log('error', message, ...details),
  }
}

export const logger = createLogger('app')
