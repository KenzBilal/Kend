/**
 * GET /api/chats/:token
 * Returns the list of available destination chats for a token
 */

import { Request, Response } from "express";
import { redis } from "../lib/redis.js";

export async function handleGetChats(req: Request, res: Response) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const data = await redis.get(`token:${token}`) as string | null;

    if (!data) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    let chats = [];
    try {
      chats = JSON.parse(data);
      if (!Array.isArray(chats)) {
        // Migration
        chats = [{ id: data, name: "Personal", type: "private" }];
      }
    } catch (e) {
      // Migration for old format
      chats = [{ id: data, name: "Personal", type: "private" }];
    }

    return res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
