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

async function sendPortalLink(botToken: string, chatId: number | string, token: string, isNew: boolean = false) {
  const domain = CONFIG.APP_URL;
  const link = `${domain}/send/${token}`;
  const title = isNew ? "🔄 <b>Your Portal Link has been Rotated!</b>" : "🚀 <b>Your Private Message Portal is Ready!</b>";

  await sendTelegramMessage(
    botToken,
    chatId,
    `${title}\n\n` +
    `Use the buttons below to manage your portal access effortlessly.`,
    "HTML",
    {
      inline_keyboard: [
        [{ text: "🌐 Open Portal", url: link }],
        [
          { text: "🔄 Rotate Link", callback_data: `action:newlink` },
          { text: "🛑 Revoke Link", callback_data: `action:revoke_ask` }
        ]
      ],
    }
  );
}

async function handleStart(botToken: string, chatId: number | string) {
  if (!CONFIG.REDIS_URL || !CONFIG.REDIS_TOKEN) {
    await sendTelegramMessage(botToken, chatId, "❌ <b>Service Error:</b> Redis missing.");
    return;
  }

  try {
    let token = (await redis.get(`user:${chatId}`)) as string | null;
    if (!token) {
      token = generateToken();
      const initialChats = [{ id: chatId.toString(), name: "Personal", type: "private" }];
      const EXPIRY = 60 * 60 * 24 * 30 * 6;
      await redis.set(`token:${token}`, JSON.stringify(initialChats), { ex: EXPIRY });
      await redis.set(`user:${chatId}`, token, { ex: EXPIRY });
    }
    await sendPortalLink(botToken, chatId, token);
  } catch (err) {
    console.error("Error in handleStart:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Database issue.");
  }
}

async function handleNewLink(botToken: string, chatId: number | string) {
  try {
    const oldToken = (await redis.get(`user:${chatId}`)) as string | null;
    let chats = [{ id: chatId.toString(), name: "Personal", type: "private" }];

    if (oldToken) {
      const data = await redis.get(`token:${oldToken}`) as string | null;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) chats = parsed;
        } catch (e) {}
      }
      await redis.del(`token:${oldToken}`);
    }

    const newToken = generateToken();
    const EXPIRY = 60 * 60 * 24 * 30 * 6;
    await redis.set(`token:${newToken}`, JSON.stringify(chats), { ex: EXPIRY });
    await redis.set(`user:${chatId}`, newToken, { ex: EXPIRY });

    await sendPortalLink(botToken, chatId, newToken, true);
  } catch (err) {
    console.error("Error in handleNewLink:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Failed to rotate token.");
  }
}

async function handleRevoke(botToken: string, chatId: number | string) {
  try {
    const token = (await redis.get(`user:${chatId}`)) as string | null;
    if (token) {
      await redis.del(`token:${token}`);
      await redis.del(`user:${chatId}`);
    }
    await sendTelegramMessage(botToken, chatId, "🛑 <b>Link Revoked.</b>\n\nYour private portal link has been deactivated. Use /start to generate a new one.");
  } catch (err) {
    console.error("Error in handleRevoke:", err);
    await sendTelegramMessage(botToken, chatId, "❌ <b>Error:</b> Failed to revoke token.");
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

async function handleCallbackQuery(botToken: string, query: any) {
  const chatId = query.from.id;
  const data = query.data;

  if (data === "action:newlink") {
    await handleNewLink(botToken, chatId);
  } else if (data === "action:revoke_ask") {
    await sendTelegramMessage(botToken, chatId, "⚠️ <b>Are you sure?</b>\n\nThis will permanently disable your current link. You will need to type /start to get a new one.", "HTML", {
      inline_keyboard: [
        [{ text: "🔥 Yes, Revoke Now", callback_data: "action:revoke_confirm" }],
        [{ text: "❌ Cancel", callback_data: "action:cancel" }]
      ]
    });
  } else if (data === "action:revoke_confirm") {
    await handleRevoke(botToken, chatId);
  } else if (data === "action:cancel") {
    await sendTelegramMessage(botToken, chatId, "✅ Action cancelled.");
  }

  // Always answer callback query to stop loading state
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: query.id }),
  });
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
      await handleCallbackQuery(botToken, update.callback_query);
      return res.status(200).json({ ok: true });
    }

    if (update.message) {
      const { chat, text } = update.message;
      if (!text) return res.status(200).json({ ok: true });

      if (text === "/start") {
        await handleStart(botToken, chat.id);
      } else if (text === "/newlink") {
        await handleNewLink(botToken, chat.id);
      } else if (text === "/revoke") {
        await handleRevoke(botToken, chat.id);
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
