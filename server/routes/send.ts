/**
 * POST /api/send
 * Sends a message to Telegram via the Bot API
 * Automatically splits long messages if they exceed 4096 characters
 */

import { Request, Response } from "express";
import { splitMessage, sendMultipartMessage } from "../telegram.js";

export async function handleSend(req: Request, res: Response) {
  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return res.status(500).json({
      error: "Server configuration error. Please contact the administrator.",
    });
  }

  // Parse request body
  let text: string;

  try {
    const body = req.body;

    if (typeof body === "string") {
      const parsed = JSON.parse(body);
      text = parsed.text;
    } else {
      text = body.text;
    }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid request: text is required" });
    }

    text = text.trim();

    if (text.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    if (text.length > 65536) {
      return res.status(400).json({
        error: "Message is too long (maximum 65536 characters)",
      });
    }
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  try {
    // Split message into chunks if necessary
    const chunks = splitMessage(text);

    // Send all chunks
    await sendMultipartMessage(botToken, chatId, chunks);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messageCount: chunks.length,
      characterCount: text.length,
    });
  } catch (error) {
    console.error("Error sending message:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Return error response
    return res.status(500).json({
      error: `Failed to send message: ${errorMessage}`,
    });
  }
}
