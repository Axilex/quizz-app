/* eslint-disable no-console */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => isDev && console.debug(...args),
};
