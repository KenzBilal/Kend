/**
 * POST /api/webhook
 * Telegram webhook endpoint for receiving bot updates
 * Handles callback queries (e.g., copy button clicks)
 */

import { Request, Response } from "express";
import { sendTelegramMessage } from "../telegram.js";

export interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat_instance: string;
    data: string;
    message?: {
      message_id: number;
      chat: { id: number };
      text: string;
    };
  };
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
    };
    chat: { id: number };
    text: string;
  };
}

export async function handleWebhook(req: Request, res: Response) {
  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify webhook signature
  const signature = req.headers["x-telegram-bot-api-secret-token"] as string;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (webhookSecret && signature !== webhookSecret) {
    console.warn("Invalid webhook signature");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const update: TelegramUpdate = req.body;

    // Handle callback queries (e.g., button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const data = callbackQuery.data;
      const userId = callbackQuery.from.id;
      const queryId = callbackQuery.id;

      console.log(`Callback query from user ${userId}: ${data}`);

      // Handle copy button click
      if (data.startsWith("copy_")) {
        try {
          // Send an answer to the callback query (shows notification)
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: queryId,
              text: "Text copied to clipboard! 📋",
              show_alert: false,
            }),
          });

          console.log(`Callback query answered for user ${userId}`);
        } catch (error) {
          console.error("Error answering callback query:", error);
        }
      }

      // Always return 200 OK to acknowledge receipt
      return res.status(200).json({ ok: true });
    }

    // Handle regular messages (optional - for logging or future features)
    if (update.message) {
      const message = update.message;
      console.log(
        `Received message from user ${message.from.id}: ${message.text}`
      );
    }

    // Always return 200 OK to acknowledge receipt
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to avoid Telegram retrying
    return res.status(200).json({ ok: true });
  }
}
