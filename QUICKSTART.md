# Quick Start Guide - 5 Minutes to Telegram Messages

This guide will get you sending messages to Telegram in 5 minutes.

## Step 1: Create a Telegram Bot (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. Choose a name (e.g., "Message Sender")
4. Choose a username (must end with `_bot`, e.g., `my_msg_sender_bot`)
5. **Copy your Bot Token** — it looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

## Step 2: Get Your Chat ID (1 minute)

1. Send any message to your bot
2. Open this URL in your browser (replace `BOT_TOKEN`):
   ```
   https://api.telegram.org/botBOT_TOKEN/getUpdates
   ```
3. Look for `"id"` inside `"chat"` — this is your **Chat ID**

**Example response:**
```json
{
  "ok": true,
  "result": [
    {
      "update_id": 123456789,
      "message": {
        "message_id": 1,
        "chat": {
          "id": 987654321,  ← This is your Chat ID
          "first_name": "John"
        }
      }
    }
  ]
}
```

## Step 3: Deploy to Vercel (2 minutes)

### Option A: Using Git (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to https://vercel.com/new
# 3. Import your GitHub repository
# 4. Add environment variables (see Step 4)
# 5. Click Deploy
```

### Option B: Using Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Add environment variables when prompted
# 4. Follow the deployment link
```

## Step 4: Add Environment Variables

In your Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   - `TELEGRAM_BOT_TOKEN` = your bot token from Step 1
   - `TELEGRAM_CHAT_ID` = your chat ID from Step 2
   - `NODE_ENV` = `production`
3. Click **Save**

## Step 5: Test It! (30 seconds)

1. Open your Vercel URL (e.g., `https://telegram-message-sender-abc123.vercel.app`)
2. Type a message in the textarea
3. Click **Send** or press `Ctrl+Enter`
4. Check your Telegram — the message should appear instantly!

---

## That's It! 🎉

Your Telegram message sender is now live. You can:

- **Send long messages** — automatically splits at 4096 characters
- **Use keyboard shortcuts** — `Ctrl+Enter` or `Cmd+Enter` to send
- **Send from any device** — works on mobile, tablet, desktop
- **Share the link** — anyone can use it to send you messages

---

## Troubleshooting

**Message not appearing?**
- Check your Bot Token is correct
- Check your Chat ID is correct
- Make sure your bot is started (send `/start` to it)

**"Message cannot be empty"?**
- Type something in the textarea before clicking send

**Deploy failed?**
- Check that all environment variables are set
- Check that your repository is public (or you're logged in to Vercel)

---

## Next Steps

- **Customize the UI** — Edit `client/src/pages/Home.tsx`
- **Add more features** — See [README.md](./README.md)
- **Set up webhook** — See [SETUP.md](./SETUP.md)

---

**Need help?** Check [SETUP.md](./SETUP.md) for detailed instructions.
