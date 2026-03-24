import { handleSend } from "../server/routes/send";

// Vercel serverless API handler wrapper with robust body parsing and logging
export default async function vercelSendHandler(req, res) {
	let rawBody = "";
	req.on && req.on("data", (chunk) => { rawBody += chunk; });
	await new Promise((resolve) => req.on && req.on("end", resolve));
	console.log("[DEBUG] typeof req.body:", typeof req.body);
	console.log("[DEBUG] req.body:", req.body);
	console.log("[DEBUG] rawBody:", rawBody);

	if (typeof req.body === "undefined" && rawBody) {
		try {
			req.body = JSON.parse(rawBody);
		} catch (e) {
			console.error("[DEBUG] JSON parse error (rawBody):", e);
			return res.status(400).json({ error: "Invalid JSON in request body" });
		}
	} else if (typeof req.body === "string") {
		try {
			req.body = JSON.parse(req.body);
		} catch (e) {
			console.error("[DEBUG] JSON parse error (req.body):", e);
			return res.status(400).json({ error: "Invalid JSON in request body" });
		}
	}
	// Delegate to the original Express handler
	return handleSend(req, res);
}
