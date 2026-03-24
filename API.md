# API Documentation

Complete reference for all API endpoints in the Telegram Message Sender system.

## Base URL

**Development:**
```
http://localhost:3000
```

**Production (Vercel):**
```
https://your-vercel-url.vercel.app
```

---

## Endpoints

### 1. Send Message

**Endpoint:** `POST /api/send`

**Description:** Send a message to your Telegram chat. Automatically splits long messages.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Your message here"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageCount": 1,
  "characterCount": 15
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Failed to send message: Invalid bot token"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello Telegram!"}'
```

**Example with JavaScript:**
```javascript
const response = await fetch('/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello Telegram!' })
});

const data = await response.json();
console.log(data);
```

**Example with Python:**
```python
import requests

response = requests.post(
  'http://localhost:3000/api/send',
  json={'text': 'Hello Telegram!'}
)

print(response.json())
```

**Constraints:**
- `text` is required and must be a non-empty string
- Maximum length: 65,536 characters
- Empty or whitespace-only messages are rejected
- Messages longer than 4,096 characters are automatically split

**Response Fields:**
- `success` (boolean) — Whether the message was sent
- `message` (string) — Status message
- `messageCount` (number) — Number of Telegram messages sent (1 for normal, >1 for split)
- `characterCount` (number) — Total characters in the original message

---

### 2. Telegram Webhook

**Endpoint:** `POST /api/webhook`

**Description:** Receives updates from Telegram Bot API. Used for callback queries (button clicks) and message events.

**Request Headers:**
```
X-Telegram-Bot-Api-Secret-Token: your_webhook_secret
Content-Type: application/json
```

**Request Body:** Telegram Update object (JSON)

**Example Callback Query Update:**
```json
{
  "update_id": 123456789,
  "callback_query": {
    "id": "4382992769132145519",
    "from": {
      "id": 987654321,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat_instance": "8414339759857099386",
    "data": "copy_message_123",
    "message": {
      "message_id": 42,
      "chat": {
        "id": 987654321,
        "type": "private"
      },
      "text": "Your message here"
    }
  }
}
```

**Response (Success - 200):**
```json
{
  "ok": true
}
```

**Notes:**
- Always returns 200 OK to acknowledge receipt (even if processing fails)
- Webhook signature is verified using `X-Telegram-Bot-Api-Secret-Token` header
- Callback queries are answered with a notification toast in Telegram

**Setting up the Webhook:**

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-vercel-url.vercel.app/api/webhook",
    "secret_token": "your_webhook_secret_here"
  }'
```

**Verifying Webhook Setup:**

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

---

### 3. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the server is running and healthy.

**Response (Success - 200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-24T06:21:06.836Z"
}
```

**Example with cURL:**
```bash
curl http://localhost:3000/api/health
```

---

## Error Handling

All error responses include an `error` field with a descriptive message.

### Common Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Invalid request: text is required | Missing or invalid `text` field |
| 400 | Message cannot be empty | Text is empty or whitespace-only |
| 400 | Message is too long | Text exceeds 65,536 characters |
| 400 | Invalid JSON in request body | Malformed JSON |
| 405 | Method not allowed | Using wrong HTTP method |
| 500 | Server configuration error | Missing environment variables |
| 500 | Failed to send message | Telegram API error |
| 401 | Unauthorized | Invalid webhook signature |

### Example Error Response

```json
{
  "error": "Failed to send message: Invalid bot token"
}
```

---

## Message Splitting Logic

When a message exceeds 4,096 characters:

1. **Detection:** Server detects message length > 4,096
2. **Splitting:** Message is split at word boundaries (newlines, spaces, or punctuation)
3. **Formatting:** Each chunk is prefixed with `[Part X/Y]` indicator
4. **Sending:** Chunks are sent with 100ms delay between them
5. **Ordering:** Delays ensure chunks appear in correct order in Telegram

### Example

**Input:** 10,000 character message

**Output (3 messages):**
```
[Part 1/3]
First 4096 characters...

[Part 2/3]
Next 4096 characters...

[Part 3/3]
Remaining characters...
```

---

## Rate Limiting

Currently, there is **no rate limiting** implemented. For production use, consider adding:

- Per-IP rate limiting (e.g., 10 requests/minute)
- Per-chat rate limiting (e.g., 100 messages/hour)
- Token-based rate limiting for authenticated users

---

## Authentication

Currently, the API has **no authentication**. For production use, consider adding:

- API key authentication
- JWT tokens
- OAuth 2.0
- Telegram OAuth login

---

## CORS

CORS is **not enabled** by default. To enable CORS for frontend requests from different origins:

```javascript
// In server/index.ts
import cors from 'cors';

app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

---

## Timeouts

- **Request timeout:** 30 seconds (default Express)
- **Telegram API timeout:** 10 seconds
- **Webhook processing timeout:** 5 seconds

---

## Monitoring

### Logging

All requests and errors are logged to the console:

```
[timestamp] POST /api/send
[timestamp] Message sent successfully (1 part)
[timestamp] Error sending message: Invalid bot token
```

### Health Monitoring

Use the `/api/health` endpoint to monitor server status:

```bash
# Check every 30 seconds
watch -n 30 'curl http://localhost:3000/api/health'
```

---

## Examples

### Send a Simple Message

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, Telegram!"}'
```

### Send a Long Message

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a very long message that will be automatically split into multiple parts if it exceeds 4096 characters. The backend will handle the splitting and send each part as a separate message to maintain order and clarity. You can send as much text as you want, up to 65536 characters total."}'
```

### Send with JavaScript Fetch

```javascript
async function sendMessage(text) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Message sent:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
sendMessage('Hello from JavaScript!');
```

### Send with Python Requests

```python
import requests
import json

def send_message(text):
    url = 'http://localhost:3000/api/send'
    payload = {'text': text}
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"Message sent: {data}")
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

# Usage
send_message('Hello from Python!')
```

### Check Server Health

```bash
curl http://localhost:3000/api/health | jq .
```

---

## Best Practices

1. **Always handle errors** — Check response status and error messages
2. **Validate input** — Ensure text is not empty before sending
3. **Use keyboard shortcuts** — `Ctrl+Enter` for faster sending
4. **Monitor health** — Periodically check `/api/health` endpoint
5. **Set up logging** — Monitor server logs for errors
6. **Use environment variables** — Never hardcode credentials
7. **Test locally first** — Verify before deploying to production

---

## Support

For issues or questions:

1. Check the [Troubleshooting](./SETUP.md#troubleshooting) section
2. Review [Telegram Bot API documentation](https://core.telegram.org/bots/api)
3. Check server logs for detailed error messages

---

**Last Updated:** March 24, 2026
