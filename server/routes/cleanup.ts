/**
 * POST /api/cleanup
 * Checks for messages scheduled for deletion and removes them from Telegram
 */

import { Request, Response } from "express";
import { redis } from "../lib/redis.js";

export async function handleCleanup(req: Request, res: Response) {
  // Simple API Key protection for cron jobs
  const authHeader = req.headers.authorization;
  const cleanupSecret = process.env.CLEANUP_SECRET;
  
  if (cleanupSecret && authHeader !== `Bearer ${cleanupSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: "Missing bot token" });
  }

  try {
    const now = Date.now();
    // Get all messages where score (timestamp) is <= now
    const expiredMessages = await redis.zrange("cleanup:messages", 0, now, { byScore: true });
    
    if (expiredMessages.length === 0) {
      return res.status(200).json({ success: true, message: "No messages to clean up" });
    }

    console.log(`🧹 Found ${expiredMessages.length} messages to clean up`);
    
    const results = {
      attempted: expiredMessages.length,
      deleted: 0,
      failed: 0
    };

    for (const msgString of expiredMessages) {
      const [chatId, messageId] = (msgString as string).split(":");
      
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
        });
        
        const data = await response.json();
        
        if (data.ok) {
          results.deleted++;
        } else {
          // If message is too old or already deleted, still count it as "processed"
          console.warn(`Failed to delete message ${messageId} in chat ${chatId}:`, data.description);
          results.failed++;
        }
      } catch (err) {
        console.error(`Error deleting message ${messageId}:`, err);
        results.failed++;
      }
      
      // Remove from Redis regardless of Telegram result (to stop retrying if it's too old)
      await redis.zrem("cleanup:messages", msgString);
    }

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${results.deleted} messages (${results.failed} failed/skipped)`,
      results
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({ error: "Internal server error during cleanup" });
  }
}
