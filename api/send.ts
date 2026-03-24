import { handleSend } from "../server/routes/send";

// Vercel serverless API handler wrapper with robust body parsing
export default async function vercelSendHandler(req, res) {
	// If req.body is undefined (Vercel/Node default), parse the raw body
	if (typeof req.body === "undefined") {
		let rawBody = "";
		await new Promise((resolve, reject) => {
			req.on("data", (chunk) => {
				rawBody += chunk;
			});
			req.on("end", resolve);
			req.on("error", reject);
		});
		try {
			req.body = JSON.parse(rawBody);
		} catch (e) {
			return res.status(400).json({ error: "Invalid JSON in request body" });
		}
	} else if (typeof req.body === "string") {
		try {
			req.body = JSON.parse(req.body);
		} catch (e) {
			return res.status(400).json({ error: "Invalid JSON in request body" });
		}
	}
	// Delegate to the original Express handler
	return handleSend(req, res);
}
