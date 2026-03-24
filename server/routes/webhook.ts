/**
 * POST /api/webhook
 * Telegram webhook endpoint for receiving bot updates
 * Handles callback queries and /start command
 */

import { Request, Response } from "express";
import { sendTelegramMessage } from "../telegram.js";
import { redis } from "../lib/redis.js";
import { CONFIG } from "../../shared/config.js";
import crypto from "crypto";

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

async function handleStart(botToken: string, chatId: number | string) {
  // Check if Redis is configured
  if (!CONFIG.REDIS_URL || !CONFIG.REDIS_TOKEN) {
    console.error("❌ Redis is not configured. Cannot generate token.", {
      hasUrl: !!CONFIG.REDIS_URL,
      hasToken: !!CONFIG.REDIS_TOKEN,
      envUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      envToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const missing = [];
    if (!CONFIG.REDIS_URL) missing.push("UPSTASH_REDIS_REST_URL");
    if (!CONFIG.REDIS_TOKEN) missing.push("UPSTASH_REDIS_REST_TOKEN");
    
    await sendTelegramMessage(botToken, chatId, `❌ <b>Service Error:</b> Missing configuration: ${missing.join(", ")}. Please verify Vercel environment variables and re-deploy.`);
    return;
  }

  try {
    // Check if user already has a token
    let token = (await redis.get(`user:${chatId}`)) as string | null;

    if (!token) {
      token = generateToken();
      // store mapping
      await redis.set(`token:${token}`, chatId.toString());
      // reverse mapping
      await redis.set(`user:${chatId}`, token);
    }

    // Use domain from CONFIG
    const domain = CONFIG.APP_URL;
    const link = `${domain}/send/${token}`;

    await sendTelegramMessage(
      botToken,
      chatId,
      `🚀 <b>Your Private Message Portal is Ready!</b>\n\n` +
      `Use this unique link to send messages from any device:\n\n` +
      `<code>${link}</code>\n\n` +
      `<b>Security Note:</b> Never share this link. It allows anyone to send messages to this chat.`,
      {
        inline_keyboard: [
          [{ text: "🌐 Open Portal", url: link }]
        ],
      }
    );
  } catch (err) {
    console.error("❌ Error in handleStart:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Failed to generate your portal link. This is usually due to a database connection issue.");
  }
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    from: {
      id: number;
    };
    data: string;
  };
  message?: {
    message_id: number;
    from: {
      id: number;
    };
    chat: {
      id: number;
    };
    text?: string;
  };
}

export async function handleWebhook(req: Request, res: Response) {
  // Allow GET for simple verification
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, status: "active", message: "Webhook is listening" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify webhook signature
  const signature = req.headers["x-telegram-bot-api-secret-token"] as string;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (webhookSecret && signature !== webhookSecret) {
    console.warn("⚠️ Webhook signature mismatch");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("❌ Missing TELEGRAM_BOT_TOKEN");
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  try {
    const update: TelegramUpdate = req.body;

    if (update.callback_query) {
      // Logic for callback queries (e.g., answer query)
      const queryId = update.callback_query.id;
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: queryId, text: "Received" }),
      });
      return res.status(200).json({ ok: true });
    }

    if (update.message) {
      const { chat, text } = update.message;
      if (text === "/start") {
        await handleStart(botToken, chat.id);
      } else {
        console.log(`Bot received message in chat ${chat.id}`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    // Always return 200 OK so Telegram stops retrying
    return res.status(200).json({ ok: true, error: String(error) });
  }
}
