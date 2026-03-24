import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, Loader2, X, Trash2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      const rawText = await res.text(); // Read as text FIRST

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Show raw HTML/text in popup if not JSON
        setError(`Status ${res.status}: Response was not JSON.\n\n${rawText.slice(0, 500)}`);
        setStatus("error");
        setStatusMessage("Response format error");
        return;
      }

      if (!res.ok) {
        setError(`Status ${res.status}: ${data.error || JSON.stringify(data)}`);
        setStatus("error");
        setStatusMessage("Failed to send message");
        return;
      }

      // success
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${errorMsg}`);
      setStatus("error");
      setStatusMessage("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* Error Popup */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-red-600 text-white rounded-none border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[9999] flex flex-col gap-2 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
              <AlertCircle className="w-4 h-4 text-white" />
              Error Details
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-black/20 p-3 border border-red-400/30">
            <pre className="whitespace-pre-wrap font-mono text-xs overflow-auto max-h-[400px]">
              {error}
            </pre>
          </div>
          <Button 
            onClick={() => setError(null)}
            variant="outline" 
            className="mt-2 self-end border-white text-white hover:bg-white hover:text-red-600 font-bold uppercase tracking-widest text-[10px] h-8 rounded-none"
          >
            DISMISS [X]
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">
            Telegram Message Sender
          </h1>
          <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest font-mono">
            Direct Terminal Interface v1.0
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
          {/* Textarea Container */}
          <div className="flex-1 flex flex-col mb-6">
            <div className="flex justify-between items-end mb-3">
              <label
                htmlFor="message"
                className="text-sm font-bold uppercase tracking-widest"
              >
                Input Buffer
              </label>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {message.length} chars
              </span>
            </div>
            <textarea
              ref={textareaRef}
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ENTER SYSTEM MESSAGE... (CTRL+ENTER TO EXECUTE)"
              className="flex-1 bg-input text-foreground border-2 border-border p-6 font-mono text-base resize-none focus:outline-none focus:border-primary transition-colors placeholder:opacity-30"
              style={{ minHeight: "300px" }}
            />
            <div className="flex gap-4 mt-2 font-mono text-[10px] text-muted-foreground uppercase">
              <span>Limit: 4096/chunk</span>
              <span>Encoding: UTF-8</span>
              <span>Status: {status.toUpperCase()}</span>
            </div>
          </div>

          {/* Button and Status Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
            <Button
              onClick={handleSend}
              disabled={status === "sending" || !message.trim()}
              className="bg-primary text-primary-foreground hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed px-12 py-6 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 rounded-none border-b-4 border-r-4 border-black active:border-0 active:translate-x-1 active:translate-y-1 transition-all flex-1 sm:flex-initial"
              size="lg"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Busy...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Execute
                </>
              )}
            </Button>

            <Button
              onClick={() => setMessage("")}
              disabled={status === "sending" || !message.trim()}
              variant="outline"
              className="border-2 border-border hover:bg-neutral-800 px-8 py-6 font-bold uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              size="lg"
            >
              <Trash2 className="w-5 h-5" />
              Clear
            </Button>

            {/* Status Indicator */}
            {statusMessage && (
              <div
                className={`flex items-center gap-3 px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest ${
                  status === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : status === "error"
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                } ${status === "sending" ? "animate-pulse" : ""}`}
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
      <footer className="border-t border-border py-8 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-mono uppercase tracking-widest">
            Transmission protocols active // No logs retained
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest">
            System Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
