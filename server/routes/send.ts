/**
 * POST /api/send
 * Sends a message to Telegram via the Bot API
 * Automatically splits long messages if they exceed 4096 characters
 */

import { Request, Response } from "express";
import { splitMessage, sendMultipartMessage } from "../telegram.js";
import { redis } from "../lib/redis.js";

export async function handleSend(req: Request, res: Response) {
  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get bot token from env
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return res.status(500).json({
      error: "Server configuration error. Please contact the administrator.",
    });
  }

  // Parse request body
  let text: string;
  let token: string;

  try {
    const body = req.body;

    if (typeof body === "string") {
      const parsed = JSON.parse(body);
      text = parsed.text;
      token = parsed.token;
    } else {
      text = body.text;
      token = body.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Access token is required" });
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
    // Validate token and get mapped chatId from Redis
    const chatId = await redis.get(`token:${token}`) as string | null;

    if (!chatId) {
      console.warn(`Unauthorized access attempt with token: ${token.substring(0, 8)}...`);
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or expired token. Please start the bot again to get a new link." 
      });
    }

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
    console.error("Error in handleSend:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Return error response
    return res.status(500).json({
      error: `Execution error: ${errorMessage}`,
    });
  }
}
