import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

async function checkWebhook() {
  console.log("🔍 Checking Telegram Webhook status...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log("✅ Webhook Info retrieved successfully:");
      console.log(JSON.stringify(data.result, null, 2));
      
      if (!data.result.url) {
        console.warn("⚠️ Webhook is NOT set! Telegram won't send updates to your server.");
      } else {
        console.log(`🔗 Current Webhook URL: ${data.result.url}`);
      }
      
      if (data.result.last_error_message) {
        console.error(`❌ Last Webhook Error: ${data.result.last_error_message}`);
      }
    } else {
      console.error("❌ Failed to get Webhook Info:", data.description);
    }
  } catch (error) {
    console.error("❌ Error connecting to Telegram API:", error);
  }
}

checkWebhook();
