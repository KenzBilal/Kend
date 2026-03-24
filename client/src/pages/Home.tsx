import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * Minimalist Brutalism Design:
 * - Deep slate background (#1a1a1a) with white text for maximum contrast
 * - Monospace textarea for technical input feel
 * - Telegram blue (#0088cc) accent for send button
 * - No rounded corners, no shadows, no gradients
 * - Keyboard shortcuts: Ctrl+Enter or Cmd+Enter to send
 * - Status indicator with subtle pulse animation
 */

type StatusType = "idle" | "sending" | "success" | "error";

export default function Home() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        window.innerHeight * 0.7
      ) + "px";
    }
  }, [message]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setStatus("error");
      setStatusMessage("Message cannot be empty");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("sending");
    setStatusMessage("Sending...");

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setStatusMessage(
        data.messageCount > 1
          ? `Message sent successfully (${data.messageCount} parts)`
          : "Message sent successfully"
      );
      setMessage("");

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 3000);

      // Focus textarea for next message
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      setStatus("error");
      setStatusMessage(errorMsg);

      // Reset status after 5 seconds on error
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">
            Telegram Message Sender
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Send messages to your Telegram chat instantly
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
          {/* Textarea Container */}
          <div className="flex-1 flex flex-col mb-6">
            <label
              htmlFor="message"
              className="text-sm font-bold mb-3 uppercase tracking-wide"
            >
              Message
            </label>
            <textarea
              ref={textareaRef}
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your message here... (Ctrl+Enter to send)"
              className="flex-1 bg-input text-foreground border border-border p-4 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              style={{ minHeight: "300px" }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supports up to 4096 characters per message. Longer messages will
              be split automatically.
            </p>
          </div>

          {/* Button and Status Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              onClick={handleSend}
              disabled={status === "sending" || !message.trim()}
              className="bg-primary text-primary-foreground hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 font-bold uppercase tracking-wide flex items-center justify-center gap-2"
              size="lg"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </Button>

            {/* Status Indicator */}
            {statusMessage && (
              <div
                className={`flex items-center gap-2 px-4 py-2 font-mono text-sm ${
                  status === "success"
                    ? "text-green-400"
                    : status === "error"
                      ? "text-red-400"
                      : "text-blue-400"
                } ${status === "sending" ? "status-pulse" : ""}`}
              >
                {status === "success" && (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {status === "error" && (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {status === "sending" && (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 sm:px-6 text-center text-xs text-muted-foreground">
        <p>
          Messages are sent via Telegram Bot API. No data is stored on our
          servers.
        </p>
      </footer>
    </div>
  );
}
