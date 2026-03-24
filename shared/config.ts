/**
 * Shared configuration for both frontend and backend
 */

const getEnv = (key: string, defaultValue: string) => {
  // Try process.env (Node.js)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  // Try import.meta.env (Vite)
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return defaultValue;
};

export const CONFIG = {
  // Telegram Bot Username (without @)
  BOT_USERNAME: getEnv("VITE_BOT_USERNAME", "Any_wherebot"),
  
  // App base URL (for generating portal links)
  APP_URL: getEnv("VITE_APP_URL", "https://kend-psi.vercel.app"),
  
  // Telegram API Base
  TELEGRAM_API_BASE: "https://api.telegram.org",
  
  // Max message length for Telegram
  MAX_MESSAGE_LENGTH: 4000,
};
