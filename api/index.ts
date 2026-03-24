import express from "express";
import { handleSend } from "../server/routes/send";
import { handleWebhook } from "../server/routes/webhook";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.post("/api/send", handleSend);
app.post("/api/webhook", handleWebhook);
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
