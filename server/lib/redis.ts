import { Redis } from "@upstash/redis";
import { CONFIG } from "../../shared/config.js";

// Graceful check – don't throw at the top level to avoid crashing the whole lambda
const url = CONFIG.REDIS_URL;
const token = CONFIG.REDIS_TOKEN;

if (!url || !token) {
  console.warn("⚠️ Redis credentials missing. Token-based system will not function correctly.");
}

export const redis = new Redis({
  url: url,
  token: token,
});
