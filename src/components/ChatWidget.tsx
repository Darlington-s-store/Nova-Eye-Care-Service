import React, { useEffect, useRef, useState } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  CalendarPlus, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  MapPin, 
  Phone, 
  Type,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/chatbot/chat`;

const INITIAL_GREETING: Msg = {
  role: "assistant",
  content:
    "Hello! 👋 I am **NOVA**, your AI Patient Care Concierge at NOVA Eye Care Services.\n\nHow can I help you today? You can ask me about our **eye tests**, **DVLA licensing**, **pricing**, **opening hours**, or **visual symptoms**.",
};

const QUICK_PROMPTS = [
  { label: "Eye Exam Services", query: "What eye care services do you offer?" },
  { label: "Prices & Fees", query: "How much do your eye tests and services cost?" },
  { label: "DVLA Driver Test", query: "Tell me about the DVLA eye test for driver license." },
  { label: "Abuakwa Location", query: "Where is your clinic located in Abuakwa?" },
  { label: "Dry or Blurry Eyes", query: "My eyes are blurry and strained, what should I do?" },
];

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largeText, setLargeText] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = window.location;
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await apiService.settings.get();
        setEnabled(settings ? settings.chatbotEnabled !== false : true);
      } catch (err) {
        console.error("Failed to check if chatbot is enabled:", err);
        setEnabled(true);
      }
    };
    checkSettings();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  // Clean up speech synthesis if widget unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (pathname.startsWith("/admin")) return null;
  if (enabled === false) return null;

  const handleSpeak = (text: string, index: number) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown characters before speech
    const cleanText = text
      .replace(/[*_#`[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setMessages([INITIAL_GREETING]);
    setError(null);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last !== INITIAL_GREETING && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const apiMessages = next.filter((m) => m !== INITIAL_GREETING);
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (resp.status === 429) { 
        setError("Too many requests. Please wait a few moments or call us directly at +233 54 417 2089."); 
        setLoading(false); 
        return; 
      }
      if (resp.status === 402) { 
        setError("Live chat service is temporarily unavailable. Please call us at +233 54 417 2089 or book online."); 
        setLoading(false); 
        return; 
      }
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat service unavailable (Status: ${resp.status})`);
      }
      
      if (!resp.body) throw new Error("No response stream received from assistant");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      const msg = e instanceof Error ? e.message : "Network issue.";
      setError(`${msg} Please try again or call our clinic directly at +233 54 417 2089.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to format markdown text into JSX safely with bolding, lists, and links
   */
  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Check if bullet point
          const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
          const textToParse = isBullet ? trimmed.substring(2) : trimmed;

          // Parse markdown links [text](url) and bold **text**
          const parts = parseMarkdownInline(textToParse);

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-primary font-bold mt-1 text-xs select-none">•</span>
                <span className="flex-1">{parts}</span>
              </div>
            );
          }

          return <p key={idx}>{parts}</p>;
        })}
      </div>
    );
  };

  const parseMarkdownInline = (text: string) => {
    // Matches [label](url) and **bold**
    const tokens: React.ReactNode[] = [];
    const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index));
      }

      if (match[2] && match[3]) {
        // [label](url)
        const label = match[2];
        const url = match[3];
        if (url.startsWith("/book")) {
          tokens.push(
            <button
              key={match.index}
              onClick={() => { setOpen(false); navigate("/book"); }}
              className="inline-flex items-center gap-1 font-bold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors mx-1"
            >
              <CalendarPlus className="h-3.5 w-3.5 inline" /> {label}
            </button>
          );
        } else if (url.startsWith("tel:")) {
          tokens.push(
            <a
              key={match.index}
              href={url}
              className="inline-flex items-center gap-1 font-bold text-emerald-600 underline underline-offset-2 hover:text-emerald-700 transition-colors mx-1"
            >
              <Phone className="h-3.5 w-3.5 inline" /> {label}
            </a>
          );
        } else {
          tokens.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors mx-0.5"
            >
              {label}
            </a>
          );
        }
      } else if (match[4]) {
        // **bold**
        tokens.push(
          <strong key={match.index} className="font-semibold text-slate-900 dark:text-slate-100">
            {match[4]}
          </strong>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push(text.substring(lastIndex));
    }

    return tokens;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            aria-label="Open NOVA AI Eye Care Assistant"
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-teal-600 text-white shadow-xl hover:shadow-primary/30 transition-all border border-white/25"
          >
            <div className="relative flex items-center justify-center">
              <MessageCircle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white"></span>
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {open && (
          <motion.div 
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 240 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[410px] sm:h-[630px] flex flex-col bg-card border border-border/70 sm:rounded-2xl shadow-2xl overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-teal-700 text-primary-foreground p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base leading-tight">NOVA AI Concierge</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-medium tracking-wide uppercase">AI Care</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-white/90 font-medium">Licensed Clinic Support • Abuakwa</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Text size accessibility toggle for eye patients */}
                <button
                  onClick={() => setLargeText(!largeText)}
                  title={largeText ? "Standard Font Size" : "Large Font Size (Low Vision)"}
                  aria-label="Toggle text size"
                  className={`p-1.5 rounded-lg transition-colors ${largeText ? "bg-white/30 text-white" : "hover:bg-white/20 text-white/80"}`}
                >
                  <Type className="h-4 w-4" />
                </button>

                {/* Reset Chat */}
                <button
                  onClick={clearChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Close */}
                <button 
                  onClick={() => setOpen(false)} 
                  aria-label="Close chat" 
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-muted/60 border-b border-border/50 px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Machine Learning Optometry Assistant
              </span>
              <a
                href="tel:0544172089"
                className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors text-[11px]"
              >
                <Phone className="h-3 w-3 text-emerald-500" /> 0544172089
              </a>
            </div>

            {/* Messages Scroll Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
              {messages.map((m, i) => {
                const isAssistant = m.role === "assistant";
                const containsBooking = isAssistant && (m.content.toLowerCase().includes("book") || m.content.toLowerCase().includes("appointment"));
                const containsLocation = isAssistant && (m.content.toLowerCase().includes("abuakwa") || m.content.toLowerCase().includes("address"));

                return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                        largeText ? "text-base" : "text-sm"
                      } ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-card border border-border/80 text-foreground rounded-bl-none shadow-sm"
                      }`}
                    >
                      {isAssistant ? renderFormattedMessage(m.content) : m.content}
                    </div>

                    {/* Action buttons & TTS for assistant */}
                    {isAssistant && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 ml-1 text-xs">
                        {/* Text-To-Speech Button */}
                        <button
                          onClick={() => handleSpeak(m.content, i)}
                          title={speakingIndex === i ? "Stop Audio" : "Listen (Text-to-Speech)"}
                          aria-label="Listen to message"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border ${
                            speakingIndex === i 
                              ? "bg-primary text-white border-primary animate-pulse" 
                              : "bg-card text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {speakingIndex === i ? (
                            <><VolumeX className="h-3 w-3" /> Stop Voice</>
                          ) : (
                            <><Volume2 className="h-3 w-3" /> Listen</>
                          )}
                        </button>

                        {/* Inline Booking Shortcut */}
                        {containsBooking && (
                          <button
                            onClick={() => { setOpen(false); navigate("/book"); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-white transition-all shadow-xs"
                          >
                            <CalendarPlus className="h-3 w-3" /> Book Appointment
                          </button>
                        )}

                        {/* Inline Location Shortcut */}
                        {containsLocation && (
                          <a
                            href="https://maps.google.com/?q=NOVA+Eye+Care+Services+Abuakwa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            <MapPin className="h-3 w-3" /> View Map
                          </a>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Thinking / Streaming Indicator */}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start items-center gap-2"
                >
                  <div className="bg-card border border-border/80 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-primary animate-bounce" /> NOVA is thinking
                    </span>
                    <div className="flex gap-1">
                      <motion.span animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      <motion.span animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                      <motion.span animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive text-center font-medium bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl">
                  {error}
                </motion.div>
              )}

              {/* Initial Quick Suggestion Chips */}
              {messages.length === 1 && !loading && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="pt-2 space-y-2.5"
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Suggested Questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => send(p.query)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-card text-slate-700 dark:text-slate-200 border border-border hover:border-primary hover:text-primary transition-all shadow-2xs hover:shadow-xs text-left"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { setOpen(false); navigate("/book"); }}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-600 text-white hover:opacity-95 transition-all shadow-sm"
                  >
                    <CalendarPlus className="h-4 w-4" /> Book Appointment Online
                  </button>
                </motion.div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="border-t border-border p-3 flex gap-2 bg-card shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about eye care, prices, hours..."
                disabled={loading}
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60 shadow-inner"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-xl h-10 w-10 shadow-sm shrink-0 bg-primary hover:bg-primary/90 text-white" 
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
