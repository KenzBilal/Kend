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
    console.error("❌ Redis is not configured. Cannot generate token.");
    await sendTelegramMessage(botToken, chatId, "❌ <b>Service Error:</b> The system is not fully configured (Redis missing). Please contact the administrator.");
    return;
  }

  try {
    // Check if user already has a token
    let token = (await redis.get(`user:${chatId}`)) as string | null;

    if (!token) {
      token = generateToken();
      const EXPIRY_SECONDS = 60 * 60 * 24 * 30 * 6; // 6 months
      
      const initialChats = [
        { id: chatId.toString(), name: "Personal", type: "private" }
      ];
      
      // store mapping as JSON
      await redis.set(`token:${token}`, JSON.stringify(initialChats), { ex: EXPIRY_SECONDS });
      // reverse mapping
      await redis.set(`user:${chatId}`, token, { ex: EXPIRY_SECONDS });
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
      `<b>Multi-Chat Support:</b>\n` +
      `Add this bot to any group/channel and type <code>/register ${token}</code> to add it as a destination.`,
      "HTML",
      {
        inline_keyboard: [
          [{ text: "🌐 Open Portal", url: link }]
        ],
      }
    );
  } catch (err) {
    console.error("❌ Error in handleStart:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Failed to generate your portal link.");
  }
}

async function handleRegister(botToken: string, chatId: number | string, token: string, chatTitle: string, chatType: string) {
  try {
    const existingData = await redis.get(`token:${token}`) as string | null;
    if (!existingData) {
      await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Invalid or expired token. Please get your token from your private chat's /start command.");
      return;
    }

    let chats: any[] = [];
    try {
      chats = JSON.parse(existingData);
      if (!Array.isArray(chats)) {
        // Migration: convert old single-id string to array
        chats = [{ id: existingData, name: "Personal", type: "private" }];
      }
    } catch (e) {
      // Migration for old format
      chats = [{ id: existingData, name: "Personal", type: "private" }];
    }

    // Check if chat already exists
    if (chats.find(c => c.id === chatId.toString())) {
      await sendTelegramMessage(botToken, chatId, "✅ This chat is already registered to your portal.");
      return;
    }

    // Add new chat
    chats.push({
      id: chatId.toString(),
      name: chatTitle || "Unnamed Chat",
      type: chatType
    });

    const EXPIRY_SECONDS = 60 * 60 * 24 * 30 * 6; // Refresh expiry
    await redis.set(`token:${token}`, JSON.stringify(chats), { ex: EXPIRY_SECONDS });

    await sendTelegramMessage(botToken, chatId, `✅ <b>Registration Successful!</b>\n\nThis chat "<b>${chatTitle}</b>" has been added to your portal.`);
  } catch (err) {
    console.error("❌ Error in handleRegister:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Failed to register this chat to the portal.");
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
      if (!text) return res.status(200).json({ ok: true });

      if (text === "/start") {
        await handleStart(botToken, chat.id);
      } else if (text.startsWith("/register")) {
        const parts = text.split(" ");
        if (parts.length < 2) {
          await sendTelegramMessage(botToken, chat.id, "⚠️ Please provide your token: <code>/register YOUR_TOKEN</code>");
        } else {
          const token = parts[1].trim();
          const title = (chat as any).title || (chat as any).first_name || "Unknown";
          await handleRegister(botToken, chat.id, token, title, (chat as any).type);
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    // Always return 200 OK so Telegram stops retrying
    return res.status(200).json({ ok: true, error: String(error) });
  }
}
