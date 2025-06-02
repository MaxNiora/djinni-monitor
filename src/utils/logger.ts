// src/utils/logger.ts
export const log = (...args: unknown[]) => console.log(new Date().toISOString(), "▶", ...args);
