import { Redis } from "@upstash/redis";

// Graceful check – don't throw at the top level to avoid crashing the whole lambda
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("⚠️ Redis credentials missing. Token-based system will not function correctly.");
}

export const redis = new Redis({
  url: url || "",
  token: token || "",
});
