import { handleSend } from "../server/routes/send";

// Vercel serverless API handler wrapper
export default async function vercelSendHandler(req, res) {
	// If body is a string, try to parse as JSON
	if (typeof req.body === "string") {
		try {
			req.body = JSON.parse(req.body);
		} catch (e) {
			return res.status(400).json({ error: "Invalid JSON in request body" });
		}
	}
	// Delegate to the original Express handler
	return handleSend(req, res);
}
