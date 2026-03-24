import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, Loader2, X, Trash2, Copy, ExternalLink, Shield, Type, Code, Terminal, Hash, Menu, ChevronDown, Users, MessageSquare, Monitor, HelpCircle } from "lucide-react";
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
  const [showDestinations, setShowDestinations] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
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
        <header className="flex flex-col gap-6 mb-8 md:mb-12">
          <div className="flex items-center justify-between w-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2.5 bg-[#0088cc] rounded-2xl shadow-[0_0_20px_rgba(0,136,204,0.3)] flex items-center justify-center relative w-11 h-11">
                <span className="text-white font-black text-2xl tracking-tighter relative z-10">K</span>
                <div className="absolute right-1 bottom-1 opacity-100 z-20">
                   <div className="bg-white rounded-full p-0.5 shadow-md">
                      <Send className="w-3 h-3 text-[#0088cc]" />
                   </div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tighter text-white">
                  KEND<span className="text-[#0088cc]"> IT</span>
                </h1>
                <p className="md:hidden text-[#444] font-mono text-[9px] uppercase tracking-[0.3em] -mt-1">
                  ID: {terminalId}
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSidebar(true)}
                className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4"
          >
            <div className="hidden md:block">
              <p className="text-[#888] font-mono text-[11px] uppercase tracking-[0.4em]">
                ID: {terminalId}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none relative">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDestinations(!showDestinations)}
                  className={`w-full sm:w-auto border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest h-12 md:h-10 px-6 rounded-2xl md:rounded-xl transition-all ${showDestinations ? "bg-white/10" : "bg-white/5"}`}
                >
                  <Hash className="w-4 h-4 mr-3" />
                  <span>Dests</span>
                  <ChevronDown className={`w-3 h-3 ml-auto sm:ml-3 transition-transform ${showDestinations ? "rotate-180" : ""}`} />
                </Button>
                
                <AnimatePresence>
                  {showDestinations && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-full sm:w-72 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl z-[100] p-2 backdrop-blur-3xl"
                    >
                      <div className="px-3 py-3 text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-1">
                        Select Target
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-1">
                        {chats.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setSelectedChatId(chat.id);
                              setShowDestinations(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-4 md:py-3 rounded-xl transition-all ${
                              selectedChatId === chat.id 
                                ? "bg-[#0088cc] text-white" 
                                : "hover:bg-white/5 text-[#888] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedChatId === chat.id ? "bg-white/20" : "bg-white/5"}`}>
                                {chat.type === 'private' ? <Monitor className="w-4 h-4" /> : 
                                 chat.type === 'channel' ? <Hash className="w-4 h-4" /> : 
                                 <Users className="w-4 h-4" />}
                              </div>
                              <span className="text-xs font-bold truncate">{chat.name}</span>
                            </div>
                            {selectedChatId === chat.id && <CheckCircle className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Button 
                variant="outline" 
                onClick={copyLink}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest h-12 md:h-10 px-5 rounded-2xl md:rounded-xl transition-all grow md:grow-0"
              >
                <Copy className="w-4 h-4 mr-2" />
                <span className="md:hidden">Share</span>
                <span className="hidden md:inline">Copy Portal</span>
              </Button>
            </div>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
              <div className="w-full sm:w-auto relative">
                <div className="flex items-center justify-between sm:justify-start gap-2 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333] mr-2">Control Panel</span>
                    <button 
                      onClick={() => setShowLegend(true)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/30 text-[#333] hover:text-[#0088cc] transition-all active:scale-90"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex p-0.5 bg-black/20 rounded-xl border border-white/5 gap-0.5">
                    {['HTML', 'MarkdownV2'].map((mode) => (
                      <button 
                        key={mode}
                        onClick={() => setParseMode(mode as any)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${parseMode === mode ? "bg-[#0088cc] text-white" : "text-[#555] hover:text-[#888]"}`}
                      >
                        {mode === 'MarkdownV2' ? 'MD' : mode}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5 mt-4 sm:mt-6">
                  {[
                    { type: 'bold', icon: <Type className="w-4 h-4" /> },
                    { type: 'code', icon: <Code className="w-4 h-4" /> },
                    { type: 'block', icon: <Terminal className="w-4 h-4" /> },
                  ].map((btn) => (
                    <button 
                      key={btn.type}
                      onClick={() => insertFormatting(btn.type as any)}
                      className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-2xl md:rounded-xl bg-white/5 border border-white/5 hover:border-[#0088cc]/50 hover:bg-[#0088cc]/10 text-[#666] hover:text-[#0088cc] transition-all active:scale-90"
                    >
                      {btn.icon}
                    </button>
                  ))}
                  
                  <div className="w-px h-8 bg-white/5 mx-1 my-auto hidden sm:block" />
                  
                  <button 
                    onClick={() => setCopyClean(!copyClean)}
                    className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-2xl md:rounded-xl border transition-all active:scale-90 ${copyClean ? "bg-[#0088cc]/20 border-[#0088cc] text-[#0088cc]" : "bg-white/5 border-white/5 text-[#666]"}`}
                  >
                    <Hash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="hidden sm:block text-[10px] font-mono text-[#444] font-bold">
                CHAR COUNT: {message.length}
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

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-stretch gap-6">
              <div className="flex gap-3 w-full">
                <Button
                  onClick={handleSend}
                  disabled={status === "sending" || !message.trim()}
                  className="flex-1 bg-[#0088cc] hover:bg-[#0099ee] text-white disabled:opacity-20 h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all text-sm grow"
                >
                  {status === "sending" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-3" />
                      Execute Relay
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setMessage("")}
                  disabled={status === "sending" || !message.trim()}
                  className="h-16 w-16 rounded-2xl border border-white/5 hover:bg-red-500/10 text-[#222] hover:text-red-500 transition-all shrink-0"
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
                    <Shield className="w-5 h-5 text-[#0088cc]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">System Menu</h2>
                    <p className="text-[10px] text-[#555] font-black uppercase tracking-widest">Portal Controls</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-[#555] hover:text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] mb-4">Account</p>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Verified User</div>
                        <div className="text-[10px] text-[#555] font-bold uppercase tracking-widest">Current Session</div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] mb-4">Sharing</p>
                    <button 
                      onClick={() => {
                        const shareData = {
                          title: 'Kend It - Secure Telegram Portal',
                          text: 'Check out Kend It, the secure way to relay messages to Telegram!',
                          url: window.location.origin
                        };
                        if (navigator.share) {
                          navigator.share(shareData).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(window.location.origin);
                          toast.success("Invite link copied to clipboard");
                        }
                      }}
                      className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-[#0088cc]/10 hover:border-[#0088cc]/30 transition-all active:scale-[0.98] text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] group-hover:scale-110 transition-transform">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-[#0088cc] transition-colors">Invite Friend</div>
                          <div className="text-[10px] text-[#555] font-bold uppercase tracking-widest">Share Kend It portal</div>
                        </div>
                      </div>
                      <Copy className="w-4 h-4 text-[#333] group-hover:text-[#0088cc] transition-colors" />
                    </button>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] mb-4">Configuration</p>
                    {[
                      { icon: <Shield className="w-4 h-4" />, label: "Security Settings", status: "Coming Soon" },
                      { icon: <Terminal className="w-4 h-4" />, label: "API Console", status: "Coming Soon" },
                      { icon: <ExternalLink className="w-4 h-4" />, label: "Bot Support", status: "Active" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all cursor-not-allowed group">
                        <div className="flex items-center gap-3">
                          <div className="text-[#444] group-hover:text-[#666]">{item.icon}</div>
                          <span className="text-xs font-bold text-[#666] group-hover:text-[#888]">{item.label}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-[#333] px-2 py-0.5 border border-white/5 rounded-md">{item.status}</span>
                      </div>
                    ))}
                 </div>
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

      <AnimatePresence>
        {showLegend && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegend(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0c0c0e] border border-white/10 p-8 rounded-[32px] z-[121] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0088cc]/10 rounded-2xl flex items-center justify-center border border-[#0088cc]/20">
                    <HelpCircle className="w-5 h-5 text-[#0088cc]" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Manual</h3>
                </div>
                <button 
                  onClick={() => setShowLegend(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#555] hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {[
                  { icon: <Type className="w-4 h-4" />, label: "Bold", desc: "Wrap selection in bold tags" },
                  { icon: <Code className="w-4 h-4" />, label: "Inline", desc: "Monospace for small snippets" },
                  { icon: <Terminal className="w-4 h-4" />, label: "Block", desc: "Multi-line code formatting" },
                  { icon: <Hash className="w-4 h-4" />, label: "Clean", desc: "Wrap total msg for 1-tap copy" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[#555] group-hover:text-[#0088cc] group-hover:border-[#0088cc]/30 transition-all">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white mb-0.5">{item.label}</div>
                      <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowLegend(false)}
                className="w-full mt-10 py-4 bg-[#0088cc] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:shadow-[#0088cc]/40 transition-all active:scale-95"
              >
                Understood
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
