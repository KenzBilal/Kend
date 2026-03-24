import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, Loader2, X, Trash2, Copy, ExternalLink, Shield, Type, Code, Terminal, Hash, Menu, ChevronDown, Users, MessageSquare, Monitor } from "lucide-react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CONFIG } from "@shared/config";

/**
 * Premium Liquid Dark Design:
 * - Deep obsidian background with subtle radial gradient
 * - Glassmorphism containers (white/5, backdrop-blur)
 * - Telegram Blue (#0088cc) primary accent with glow
 * - Smooth Framer Motion transitions
 * - Responsive, tactile feedback
 */

type StatusType = "idle" | "sending" | "success" | "error";

export default function Home() {
  const params = useParams();
  const token = params.token;
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parseMode, setParseMode] = useState<"HTML" | "MarkdownV2">("HTML");
  const [copyClean, setCopyClean] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        window.innerHeight * 0.6
      ) + "px";
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (token) {
      const fetchChats = async () => {
        try {
          const res = await fetch(`/api/chats/${token}`);
          const data = await res.json();
          if (data.success) {
            setChats(data.chats);
            if (data.chats.length > 0 && !selectedChatId) {
              setSelectedChatId(data.chats[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch chats:", err);
        }
      };
      fetchChats();
    }
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Portal link copied to clipboard");
  };
  
  const insertFormatting = (type: 'bold' | 'code' | 'block') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let openTag = "", closeTag = "";

    if (parseMode === "HTML") {
      if (type === 'bold') { openTag = "<b>"; closeTag = "</b>"; }
      else if (type === 'code') { openTag = "<code>"; closeTag = "</code>"; }
      else if (type === 'block') { openTag = "<pre>"; closeTag = "</pre>"; }
    } else {
      // Basic MarkdownV2 (escaping not included for simplicity of UI buttons)
      if (type === 'bold') { openTag = "*"; closeTag = "*"; }
      else if (type === 'code') { openTag = "`"; closeTag = "`"; }
      else if (type === 'block') { openTag = "```\n"; closeTag = "\n```"; }
    }

    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    setMessage(newText);
    
    setTimeout(() => {
      textarea.focus();
      const offset = openTag.length;
      textarea.setSelectionRange(start + offset, end + offset);
    }, 0);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!token) {
      setError("Session Error: Invalid or missing token. Access via Telegram.");
      return;
    }

    setStatus("sending");
    setStatusMessage("Broadcasting to Telegram...");
    setError(null);

    const finalMessage = copyClean ? `<pre>${message}</pre>` : message;
    const finalParseMode = copyClean ? "HTML" : parseMode;

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: finalMessage, 
          token, 
          parseMode: finalParseMode,
          targetChatId: selectedChatId 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to relay message");
      }

      setStatus("success");
      setStatusMessage("Transmission successful");
      setMessage("");
      toast.success("Message relayed successfully");

      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 3000);

      textareaRef.current?.focus();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatus("error");
      setStatusMessage("Transmission failed");
      toast.error(errorMsg);
    }
  };

  const terminalId = token ? token.substring(0, 8).toUpperCase() : "NULL";

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e3] selection:bg-[#0088cc]/30 overflow-x-hidden font-sans selection:text-white">
      {/* Background Decor - Simplified for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-[#0088cc]/5 blur-[60px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[25%] h-[25%] bg-purple-500/3 blur-[50px] rounded-full" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[100]"
          >
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 p-4 rounded-2xl shadow-2xl flex items-start gap-4">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-500 font-bold text-sm tracking-tight">Access Denied / System Error</h3>
                <p className="text-red-400/80 text-xs mt-1 font-mono leading-relaxed">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500/50 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16 relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#0088cc] rounded-2xl shadow-[0_0_20px_rgba(0,136,204,0.3)] flex items-center justify-center relative w-11 h-11">
                <span className="text-white font-black text-2xl tracking-tighter relative z-10 transition-transform hover:scale-110">K</span>
                <div className="absolute right-1 bottom-1 opacity-100 z-20">
                   <div className="bg-white rounded-full p-0.5 shadow-md transform -rotate-12 hover:rotate-0 transition-transform">
                      <Send className="w-3 h-3 text-[#0088cc]" />
                   </div>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter text-white">
                KEND<span className="text-[#0088cc]"> IT</span>
              </h1>
            </div>
            <p className="text-[#888] font-mono text-[11px] uppercase tracking-[0.4em]">
              ID: {terminalId}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3 relative"
          >
            <div className="hidden sm:flex items-center gap-2 px-4 h-10 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-xl">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
              Live Link
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowSidebar(true)}
                className={`border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest h-10 px-4 rounded-xl transition-all ${showSidebar ? "bg-white/10" : "bg-white/5"}`}
              >
                <Menu className="w-4 h-4 mr-2" />
                Dests
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={copyLink}
              className="bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest h-10 px-5 rounded-xl transition-all hidden md:flex"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </motion.div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-10 shadow-2xl flex flex-col group"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#555] group-hover:text-[#888] transition-colors mr-2">
                  Format
                </span>
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 gap-1">
                  <button 
                    onClick={() => setParseMode("HTML")}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${parseMode === "HTML" ? "bg-[#0088cc] text-white shadow-lg" : "text-[#555] hover:text-[#888]"}`}
                  >
                    HTML
                  </button>
                  <button 
                    onClick={() => setParseMode("MarkdownV2")}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${parseMode === "MarkdownV2" ? "bg-[#0088cc] text-white shadow-lg" : "text-[#555] hover:text-[#888]"}`}
                  >
                    MD
                  </button>
                </div>
                
                <div className="w-px h-6 bg-white/5 mx-2" />
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => insertFormatting('bold')}
                    title="Bold"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-[#0088cc]/50 hover:bg-[#0088cc]/10 text-[#666] hover:text-[#0088cc] transition-all active:scale-95"
                  >
                    <Type className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => insertFormatting('code')}
                    title="Inline Code"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-[#0088cc]/50 hover:bg-[#0088cc]/10 text-[#666] hover:text-[#0088cc] transition-all active:scale-95"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => insertFormatting('block')}
                    title="Code Block"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-[#0088cc]/50 hover:bg-[#0088cc]/10 text-[#666] hover:text-[#0088cc] transition-all active:scale-95"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={() => setCopyClean(!copyClean)}
                    title="Copy Clean Mode"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${copyClean ? "bg-[#0088cc]/20 border-[#0088cc] text-[#0088cc] shadow-[0_0_12px_rgba(0,136,204,0.2)]" : "bg-white/5 border-white/5 hover:border-[#0088cc]/50 text-[#666] hover:text-[#0088cc]"}`}
                  >
                    <Hash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-mono text-[#555]">
                <span>{message.length} <span className="opacity-50">CHARS</span></span>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start typing your secure message..."
              className="flex-1 w-full bg-transparent text-white font-mono text-lg md:text-xl leading-relaxed resize-none focus:outline-none placeholder:text-[#333] selection:bg-[#0088cc]/40 transition-all custom-scrollbar"
              style={{ minHeight: "320px" }}
            />

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex gap-4 items-center">
                <Button
                  onClick={handleSend}
                  disabled={status === "sending" || !message.trim()}
                  className="bg-[#0088cc] hover:bg-[#0099ee] text-white disabled:opacity-20 px-10 h-16 rounded-2xl font-black uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(0,136,204,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(0,136,204,0.5)] hover:-translate-y-0.5 transition-all text-sm group"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      Broadcasting
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Execute Relay
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setMessage("")}
                  disabled={status === "sending" || !message.trim()}
                  className="h-16 w-16 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-[#444] hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-6 h-6" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center gap-3 px-6 h-12 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] border z-20 ${
                      status === "success" 
                        ? "bg-green-500/5 text-green-400 border-green-500/20 shadow-[0_4px_16px_rgba(34,197,94,0.1)]" 
                        : status === "error"
                        ? "bg-red-500/5 text-red-400 border-red-500/20"
                        : "bg-[#0088cc]/5 text-[#0088cc] border-[#0088cc]/20 shadow-[0_4px_16px_rgba(0,136,204,0.1)]"
                    }`}
                  >
                    {status === "success" && <CheckCircle className="w-4 h-4" />}
                    {status === "error" && <AlertCircle className="w-4 h-4" />}
                    {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {statusMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <footer className="mt-auto pt-16 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[#444] transition-all">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-40 hover:opacity-100 cursor-default transition-opacity">
                STABLE
              </span>
            </div>
            
            <a 
              href={`https://t.me/${CONFIG.BOT_USERNAME}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest hover:text-[#0088cc] transition-colors flex items-center gap-2"
            >
              Open Support Bot <ExternalLink className="w-3 h-3" />
            </a>
          </footer>
        </main>
      </div>
      {/* Sidebar Component */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0c0c0e] border-l border-white/5 z-[101] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              {/* Sidebar Header */}
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0088cc]/10 rounded-2xl flex items-center justify-center border border-[#0088cc]/20">
                    <Menu className="w-5 h-5 text-[#0088cc]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">Relay Targets</h2>
                    <p className="text-[10px] text-[#555] font-black uppercase tracking-widest">Active Destinations</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-[#555] hover:text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3 custom-scrollbar">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      setShowSidebar(false);
                      toast.success(`Target switched: ${chat.name}`);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-5 rounded-2xl transition-all group active:scale-[0.97] border ${
                      selectedChatId === chat.id 
                        ? "bg-[#0088cc] border-[#0088cc] shadow-[0_8px_24px_-4px_rgba(0,136,204,0.4)] text-white" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-[#888] hover:text-white hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-11 h-11 rounded-1.5xl flex items-center justify-center transition-all ${
                        selectedChatId === chat.id ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                      }`}>
                        {chat.type === 'private' ? <Monitor className="w-5 h-5" /> : 
                         chat.type === 'channel' ? <Hash className="w-5 h-5" /> : 
                         <Users className="w-5 h-5" />}
                      </div>
                      <div className="text-left overflow-hidden">
                        <div className="text-sm font-bold truncate leading-tight tracking-tight">{chat.name}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1`}>
                          Type: {chat.type}
                        </div>
                      </div>
                    </div>
                    {selectedChatId === chat.id && <CheckCircle className="w-4 h-4" />}
                  </button>
                ))}
                
                {chats.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                      <Hash className="w-10 h-10 text-[#222]" />
                    </div>
                    <p className="text-sm font-bold text-[#444] leading-relaxed">
                      No destinations found.<br/>
                      Add the bot to a group and use <b>/register</b>.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-8 pt-6 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#333] uppercase tracking-[0.25em]">
                  <span>Protocol Secure</span>
                  <span>v2.4.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
