/**
 * Simplified logger for testing purposes
 */
export function larkLogger(component) {
  return {
    debug: (...args) => console.debug(`[DEBUG][${component}]`, ...args),
    info: (...args) => console.info(`[INFO][${component}]`, ...args),
    warn: (...args) => console.warn(`[WARN][${component}]`, ...args),
    error: (...args) => console.error(`[ERROR][${component}]`, ...args)
  };
}