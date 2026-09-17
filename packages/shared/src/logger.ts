export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warning(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export interface LoggerOptions {
  debug?: boolean;
  /**
   * When true, progress/info/success go nowhere (stdout is reserved for JSON).
   * Errors still go to stderr. Debug still goes to stderr if enabled.
   */
  quiet?: boolean;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const debugEnabled = options.debug === true;
  const quiet = options.quiet === true;

  return {
    info(message: string) {
      if (!quiet) {
        process.stdout.write(`${message}\n`);
      }
    },
    success(message: string) {
      if (!quiet) {
        process.stdout.write(`✓ ${message}\n`);
      }
    },
    warning(message: string) {
      process.stderr.write(`warning: ${message}\n`);
    },
    error(message: string) {
      process.stderr.write(`error: ${message}\n`);
    },
    debug(message: string) {
      if (debugEnabled) {
        process.stderr.write(`[debug] ${message}\n`);
      }
    },
  };
}

export const silentLogger: Logger = {
  info() {},
  success() {},
  warning() {},
  error() {},
  debug() {},
};
