/**
 * Telegram Bot Utilities
 * Handles message splitting, API calls, and webhook communication
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_MESSAGE_LENGTH = 4000; // Reduced from 4096 to leave room for [Part X/Y] prefixes

export interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        callback_data?: string;
        url?: string;
      }>
    >;
  };
}

export interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    text: string;
  };
  error_code?: number;
  description?: string;
}

/**
 * Split a long message into chunks that fit Telegram's 4096 character limit
 * Tries to split at word boundaries to avoid breaking text awkwardly
 */
export function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Try to find a good split point (newline, space, or punctuation)
    let splitPoint = MAX_MESSAGE_LENGTH;

    // Prefer splitting at newline
    const lastNewline = remaining.lastIndexOf("\n", MAX_MESSAGE_LENGTH);
    if (lastNewline > MAX_MESSAGE_LENGTH - 500) {
      splitPoint = lastNewline + 1;
    } else {
      // Otherwise, try to split at a space
      const lastSpace = remaining.lastIndexOf(" ", MAX_MESSAGE_LENGTH);
      if (lastSpace > MAX_MESSAGE_LENGTH - 500) {
        splitPoint = lastSpace + 1;
      }
    }

    chunks.push(remaining.substring(0, splitPoint).trim());
    remaining = remaining.substring(splitPoint).trim();
  }

  return chunks;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  replyMarkup?: TelegramMessage["reply_markup"]
): Promise<TelegramResponse> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;

  const payload: TelegramMessage = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      throw new Error(
        `Telegram API error: ${data.description || "Unknown error"}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

/**
 * Send multiple message chunks in order with a small delay between them
 * to ensure they appear in the correct order in Telegram
 */
export async function sendMultipartMessage(
  botToken: string,
  chatId: string | number,
  chunks: string[]
): Promise<TelegramResponse[]> {
  const results: TelegramResponse[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const prefix =
      chunks.length > 1 ? `<b>[Part ${i + 1}/${chunks.length}]</b>\n\n` : "";

    try {
      const result = await sendTelegramMessage(
        botToken,
        chatId,
        prefix + chunk
      );
      results.push(result);

      // Add a small delay between messages to ensure order
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error sending chunk ${i + 1}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Validate Telegram webhook signature
 * Used to verify that webhook requests come from Telegram
 */
export function validateWebhookSignature(
  body: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  // In production, you would verify the signature using HMAC-SHA256
  // For now, we'll use a simple token-based verification
  // Telegram sends X-Telegram-Bot-Api-Secret-Token header
  return signature === secret;
}

/**
 * Format a message for display in Telegram with inline copy button
 */
export function formatMessageWithCopyButton(
  originalText: string,
  messageId: string
): {
  text: string;
  replyMarkup: TelegramMessage["reply_markup"];
} {
  return {
    text: originalText,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "📋 Copy",
            callback_data: `copy_${messageId}`,
          },
        ],
      ],
    },
  };
}
