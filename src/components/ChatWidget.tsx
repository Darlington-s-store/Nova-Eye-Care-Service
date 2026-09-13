import React, { useEffect, useRef, useState, useCallback } from "react";
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
  PhoneCall, 
  PhoneOff, 
  Type, 
  Bot, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Radio, 
  Languages 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };
type Lang = "en" | "twi";

const CHAT_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/chatbot/chat`;

const INITIAL_GREETINGS: Record<Lang, Msg> = {
  en: {
    role: "assistant",
    content:
      "Hello! 👋 I am **NOVA**, your AI Patient Care Concierge at NOVA Eye Care Services.\n\nHow can I help you today? You can speak to me with your voice or type your questions about our **eye tests**, **DVLA licensing**, **pricing**, **opening hours**, or **visual symptoms**.",
  },
  twi: {
    role: "assistant",
    content:
      "Akwaaba! 👋 Me din de **NOVA**, wo AI Ani Sohwɛfoɔ wɔ NOVA Eye Care Services wɔ Abuakwa.\n\nƐte sɛn? Wobɛtumi de wo nne akasa akyerɛ me anaa atwerɛ me biribiara a worepɛ afa yɛn **ani nhwehwɛmu**, **DVLA kwan so ani sɔhwɛ**, **boɔ a yɛgye**, **beaeɛ a yɛwɔ**, anaa **w'ani a ɛreyɛ wo ya** ho.",
  },
};

const QUICK_PROMPTS: Record<Lang, { label: string; query: string }[]> = {
  en: [
    { label: "Eye Exam Services", query: "What eye care services do you offer?" },
    { label: "Prices & Fees", query: "How much do your eye tests and services cost?" },
    { label: "DVLA Driver Test", query: "Tell me about the DVLA eye test for driver license." },
    { label: "Abuakwa Location", query: "Where is your clinic located in Abuakwa?" },
    { label: "Dry or Blurry Eyes", query: "My eyes are blurry and strained, what should I do?" },
  ],
  twi: [
    { label: "Ani Nhwehwɛmu", query: "Ani ho dwumadi bɛn na mowɔ wɔ Nova Eye Care?" },
    { label: "Boɔ a Yɛgye", query: "Ani nhwehwɛmu no, boɔ ahe na mogye?" },
    { label: "DVLA Ani Sɔhwɛ", query: "Kyerɛ me DVLA laseense ani sɔhwɛ no ho asɛm." },
    { label: "Abuakwa Beaeɛ", query: "Ɛhe koraa na mo asopiti no wɔ wɔ Abuakwa?" },
    { label: "Ani Si / Wusiwusi", query: "M'ani so ayɛ me wusiwusi na ɛyɛ me ya, dɛn na menyɛ?" },
  ],
};

export const ChatWidget = () => {
  const [lang, setLang] = useState<Lang>("en");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_GREETINGS.en]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largeText, setLargeText] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = window.location;
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // ===================== VOICE AGENT STATES =====================
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isVoiceModeRef = useRef(isVoiceMode);
  const isMutedRef = useRef(isMuted);
  const isSpeakingVoiceRef = useRef(isSpeakingVoice);
  const loadingRef = useRef(loading);
  const langRef = useRef(lang);

  isVoiceModeRef.current = isVoiceMode;
  isMutedRef.current = isMuted;
  isSpeakingVoiceRef.current = isSpeakingVoice;
  loadingRef.current = loading;
  langRef.current = lang;

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

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Toggle language and update greeting if still fresh
  const toggleLanguage = (newLang: Lang) => {
    setLang(newLang);
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [INITIAL_GREETINGS[newLang]];
      }
      return prev;
    });
  };

  // ===================== SPEECH RECOGNITION SETUP =====================
  const getSpeechRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (isMutedRef.current || isSpeakingVoiceRef.current || loadingRef.current) return;

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setVoiceError(
        langRef.current === "twi"
          ? "Wo braosa yi nnye nne nkyerɛwedeɛ. Yɛsrɛ wo fa Chrome, Edge, anaa Safari bue."
          : "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langRef.current === "twi" ? "en-GH" : "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        setLiveTranscript(currentText);

        if (final.trim()) {
          stopListening();
          setLiveTranscript("");
          send(final.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError(
            langRef.current === "twi"
              ? "Kwan nni hɔ ma maekrofoun no. Yɛsrɛ wo bue maekrofoun no wɔ wo braosa no so."
              : "Microphone access blocked. Please enable microphone permissions in your browser."
          );
          setIsListening(false);
        } else if (event.error === "no-speech") {
          if (isVoiceModeRef.current && !isSpeakingVoiceRef.current && !isMutedRef.current && !loadingRef.current) {
            setTimeout(() => startListening(), 400);
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isVoiceModeRef.current && !isSpeakingVoiceRef.current && !loadingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (isVoiceModeRef.current && !isSpeakingVoiceRef.current && !loadingRef.current && !isMutedRef.current) {
              startListening();
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [stopListening]);

  // ===================== SPEECH SYNTHESIS (VOICE OUTPUT) =====================
  const speakTextAloud = useCallback((text: string, onFinish?: () => void) => {
    if (!window.speechSynthesis) {
      if (onFinish) onFinish();
      return;
    }

    window.speechSynthesis.cancel();
    stopListening();

    const clean = text
      .replace(/[*_#`[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/👉|🚗|📍|⏰|📋|📅|💡|🚨|👋/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")) && v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsSpeakingVoice(true);
    };

    utterance.onend = () => {
      setIsSpeakingVoice(false);
      if (onFinish) onFinish();
      if (isVoiceModeRef.current && !isMutedRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };

    utterance.onerror = () => {
      setIsSpeakingVoice(false);
      if (onFinish) onFinish();
      if (isVoiceModeRef.current && !isMutedRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [startListening, stopListening]);

  const interruptSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingVoice(false);
    setSpeakingIndex(null);
    if (isVoiceModeRef.current && !isMutedRef.current) {
      setTimeout(() => startListening(), 300);
    }
  };

  const enterVoiceMode = () => {
    setIsVoiceMode(true);
    setError(null);
    setVoiceError(null);
    setTimeout(() => {
      startListening();
    }, 400);
  };

  const exitVoiceMode = () => {
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingVoice(false);
    setIsVoiceMode(false);
    setLiveTranscript("");
  };

  const toggleTextDictation = () => {
    if (isListening) {
      stopListening();
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setError(lang === "twi" ? "Braosa yi nnye nne nkyerɛwedeɛ." : "Speech recognition is not supported in this browser.");
      return;
    }

    try {
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === "twi" ? "en-GH" : "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          setError(lang === "twi" ? "Kwan nni hɔ ma maekrofoun no." : "Microphone permission denied.");
        }
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  if (pathname.startsWith("/admin")) return null;
  if (enabled === false) return null;

  const handleSpeak = (text: string, index: number) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(index);
    speakTextAloud(text, () => setSpeakingIndex(null));
  };

  const clearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopListening();
    setSpeakingIndex(null);
    setIsSpeakingVoice(false);
    setMessages([INITIAL_GREETINGS[lang]]);
    setError(null);
    setLiveTranscript("");
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
        if (last?.role === "assistant" && !Object.values(INITIAL_GREETINGS).includes(last) && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const apiMessages = next.filter((m) => !Object.values(INITIAL_GREETINGS).includes(m));
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: apiMessages, lang }),
      });

      if (resp.status === 429) { 
        const errTxt = lang === "twi"
          ? "Nnipa pii rebisa nsɛm seesei ara. Yɛsrɛ wo twɛn kakra anaa frɛ yɛn wɔ +233 54 417 2089."
          : "Too many requests. Please wait a few moments or call us directly at +233 54 417 2089.";
        setError(errTxt);
        if (isVoiceModeRef.current) speakTextAloud(errTxt);
        setLoading(false); 
        return; 
      }
      if (resp.status === 402) { 
        const errTxt = lang === "twi"
          ? "Intanɛte nkɔmmɔbɔ no nnyɛ adwuma seesei. Yɛsrɛ wo frɛ yɛn wɔ +233 54 417 2089."
          : "Live chat service is temporarily unavailable. Please call us at +233 54 417 2089 or book online.";
        setError(errTxt);
        if (isVoiceModeRef.current) speakTextAloud(errTxt);
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

      if (isVoiceModeRef.current && assistantSoFar) {
        speakTextAloud(assistantSoFar);
      }
    } catch (e) {
      console.error("Chat error:", e);
      const msg = e instanceof Error ? e.message : "Network issue.";
      const fullError = lang === "twi"
        ? `${msg} Yɛsrɛ wo sɔ hwɛ bio anaa frɛ asopiti no tee wɔ +233 54 417 2089.`
        : `${msg} Please try again or call our clinic directly at +233 54 417 2089.`;
      setError(fullError);
      if (isVoiceModeRef.current) {
        speakTextAloud(
          lang === "twi"
            ? "Mente wo nka yie. Yɛsrɛ wo sɔ hwɛ bio anaa frɛ yɛn wɔ 0544172089."
            : "I had trouble connecting. Please try again or call us at 0544172089."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
          const textToParse = isBullet ? trimmed.substring(2) : trimmed;
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
    const tokens: React.ReactNode[] = [];
    const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index));
      }

      if (match[2] && match[3]) {
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

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user");

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!open && (
          <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5">
            {/* Quick Voice Call Launcher Pill */}
            <motion.button
              initial={{ scale: 0, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setOpen(true); enterVoiceMode(); }}
              aria-label="Talk to NOVA Voice Agent"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-card/95 text-primary border border-primary/30 shadow-lg hover:border-primary backdrop-blur-md transition-all font-semibold text-xs"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Mic className="h-4 w-4 text-primary" />
              <span>{lang === "twi" ? "Kasa kyerɛ NOVA" : "Voice Agent"}</span>
            </motion.button>

            {/* Main Chat Circle Launcher */}
            <motion.button
              key="chat-button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen(true)}
              aria-label="Open NOVA AI Eye Care Assistant"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-teal-600 text-white shadow-xl hover:shadow-primary/30 transition-all border border-white/25"
            >
              <div className="relative flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white"></span>
                </span>
              </div>
            </motion.button>
          </div>
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
            className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[420px] sm:h-[640px] flex flex-col bg-card border border-border/70 sm:rounded-2xl shadow-2xl overflow-hidden font-sans"
          >
            {/* ======================= HEADER ======================= */}
            <div className="bg-gradient-to-r from-primary via-teal-700 to-primary text-primary-foreground p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  {isVoiceMode ? (
                    <Radio className="h-5 w-5 text-emerald-300 animate-pulse" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base leading-tight">
                      {isVoiceMode 
                        ? (lang === "twi" ? "NOVA Nne Nkɔmmɔ" : "NOVA Voice Call") 
                        : (lang === "twi" ? "NOVA Ani Sohwɛfoɔ" : "NOVA AI Concierge")}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-medium tracking-wide uppercase">
                      {isVoiceMode ? "Voice Live" : "AI Care"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-white/90 font-medium">
                      {isVoiceMode 
                        ? (isSpeakingVoice 
                            ? (lang === "twi" ? "NOVA rekasa kyerɛ wo..." : "Speaking to you...") 
                            : isListening 
                            ? (lang === "twi" ? "NOVA retie wo kasa..." : "Listening to you...") 
                            : loading 
                            ? (lang === "twi" ? "Redwene asɛm no ho..." : "Thinking...") 
                            : (lang === "twi" ? "Ayɛ krado" : "Connected")) 
                        : (lang === "twi" ? "Abuakwa Ani Asopiti • Twi / Eng" : "Licensed Clinic Support • Abuakwa")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 🇬🇭 Language Selector Pill (EN | TWI) */}
                <div className="flex items-center rounded-lg bg-white/20 p-0.5 border border-white/20 text-[10px] font-bold shadow-xs">
                  <button
                    onClick={() => toggleLanguage("en")}
                    className={`px-1.5 py-0.5 rounded-md transition-all ${
                      lang === "en" ? "bg-white text-primary shadow-xs font-black" : "text-white/85 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => toggleLanguage("twi")}
                    className={`px-1.5 py-0.5 rounded-md transition-all ${
                      lang === "twi" ? "bg-white text-primary shadow-xs font-black" : "text-white/85 hover:text-white"
                    }`}
                  >
                    TWI
                  </button>
                </div>

                {/* Voice Call Mode Toggle Button */}
                {!isVoiceMode ? (
                  <button
                    onClick={enterVoiceMode}
                    title={lang === "twi" ? "Bisa asɛm de wo nne" : "Switch to Hands-Free Voice Agent Call"}
                    aria-label="Start Voice Call"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
                    <span className="hidden sm:inline">{lang === "twi" ? "Nne" : "Voice Call"}</span>
                  </button>
                ) : (
                  <button
                    onClick={exitVoiceMode}
                    title={lang === "twi" ? "Kɔ atwerɛ mu" : "Switch back to Text Chat"}
                    aria-label="Switch to Text Mode"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{lang === "twi" ? "Atwerɛ" : "Text Mode"}</span>
                  </button>
                )}

                {/* Text size accessibility toggle */}
                {!isVoiceMode && (
                  <button
                    onClick={() => setLargeText(!largeText)}
                    title={largeText ? "Standard Font Size" : "Large Font Size (Low Vision)"}
                    aria-label="Toggle text size"
                    className={`p-1.5 rounded-lg transition-colors ${largeText ? "bg-white/30 text-white" : "hover:bg-white/20 text-white/80"}`}
                  >
                    <Type className="h-4 w-4" />
                  </button>
                )}

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
                  onClick={() => { exitVoiceMode(); setOpen(false); }} 
                  aria-label="Close chat" 
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ======================= BODY ======================= */}
            {isVoiceMode ? (
              /* =================== VOICE AGENT CALL SCREEN =================== */
              <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                      {lang === "twi" ? "🇬🇭 Asante Twi Voice Live" : "Voice AI Active"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {isMuted 
                      ? (lang === "twi" ? "MIC ATO MU" : "MIC MUTED") 
                      : isSpeakingVoice 
                      ? (lang === "twi" ? "NOVA REKASA" : "NOVA SPEAKING") 
                      : loading 
                      ? (lang === "twi" ? "REDWENE HO" : "PROCESSING") 
                      : isListening 
                      ? (lang === "twi" ? "RETIE WO" : "LISTENING") 
                      : "READY"}
                  </span>
                </div>

                {/* Center Dynamic Animated Soundwave Orb */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
                  <div className="relative flex items-center justify-center">
                    <AnimatePresence>
                      {(isListening || isSpeakingVoice) && (
                        <>
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0.2 }}
                            animate={{ 
                              scale: isSpeakingVoice ? [1, 1.45, 1] : [1, 1.25, 1], 
                              opacity: [0.15, 0.45, 0.15] 
                            }}
                            transition={{ repeat: Infinity, duration: isSpeakingVoice ? 1.4 : 2.0, ease: "easeInOut" }}
                            className={`absolute rounded-full border-2 ${
                              isSpeakingVoice 
                                ? "w-48 h-48 border-teal-400/40 bg-teal-500/10 shadow-[0_0_50px_rgba(20,184,166,0.3)]" 
                                : "w-44 h-44 border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                            }`}
                          />
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0.3 }}
                            animate={{ 
                              scale: isSpeakingVoice ? [1.1, 1.6, 1.1] : [1, 1.35, 1], 
                              opacity: [0.1, 0.3, 0.1] 
                            }}
                            transition={{ repeat: Infinity, duration: isSpeakingVoice ? 1.6 : 2.2, delay: 0.2, ease: "easeInOut" }}
                            className="absolute w-56 h-56 rounded-full border border-teal-300/20"
                          />
                        </>
                      )}
                    </AnimatePresence>

                    {loading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                        className="absolute w-40 h-40 rounded-full border-2 border-dashed border-amber-400/60"
                      />
                    )}

                    {/* Main Core Orb */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isSpeakingVoice) {
                          interruptSpeaking();
                        } else if (isListening) {
                          stopListening();
                        } else {
                          startListening();
                        }
                      }}
                      className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all cursor-pointer ${
                        isMuted 
                          ? "bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-slate-500"
                          : isSpeakingVoice
                          ? "bg-gradient-to-tr from-primary via-teal-500 to-emerald-400 shadow-[0_0_35px_rgba(20,184,166,0.6)]"
                          : loading
                          ? "bg-gradient-to-tr from-amber-600 to-teal-600 shadow-[0_0_35px_rgba(245,158,11,0.5)]"
                          : isListening
                          ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_35px_rgba(16,185,129,0.6)]"
                          : "bg-gradient-to-tr from-slate-800 to-teal-800 border border-teal-500/40"
                      }`}
                    >
                      {isSpeakingVoice ? (
                        <div className="flex items-center gap-1">
                          <motion.span animate={{ height: [12, 28, 12] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                          <motion.span animate={{ height: [16, 36, 16] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                          <motion.span animate={{ height: [8, 22, 8] }} transition={{ repeat: Infinity, duration: 0.45, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                          <motion.span animate={{ height: [14, 32, 14] }} transition={{ repeat: Infinity, duration: 0.55, delay: 0.15 }} className="w-1 bg-white rounded-full" />
                        </div>
                      ) : loading ? (
                        <Sparkles className="h-10 w-10 text-amber-200 animate-pulse" />
                      ) : isMuted ? (
                        <MicOff className="h-10 w-10 text-slate-300" />
                      ) : isListening ? (
                        <Mic className="h-10 w-10 text-white animate-bounce" />
                      ) : (
                        <Bot className="h-10 w-10 text-teal-200" />
                      )}
                    </motion.button>
                  </div>

                  {/* Verbal Status Prompt */}
                  <div className="mt-6 text-center">
                    <h4 className="font-bold text-base text-slate-100">
                      {isMuted 
                        ? (lang === "twi" ? "Maekrofoun no ato mu" : "Microphone Muted") 
                        : isSpeakingVoice 
                        ? (lang === "twi" ? "NOVA rekasa kyerɛ wo..." : "NOVA is Speaking...") 
                        : loading 
                        ? (lang === "twi" ? "NOVA redwene ho..." : "NOVA is Thinking...") 
                        : isListening 
                        ? (lang === "twi" ? "Retie wo... (Kasa seesei)" : "Listening... (Speak now)") 
                        : (lang === "twi" ? "Klike so na kasa" : "Tap Orb to Speak")}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                      {isSpeakingVoice 
                        ? (lang === "twi" ? "Klike orb no so sɛ worepɛ sɛ wobisa asɛmfoforɔ" : "Tap orb or 'Interrupt' to ask another question") 
                        : isListening 
                        ? (lang === "twi" ? "Bisa fa ani nhwehwɛmu, boɔ, DVLA, anaa beaeɛ a yɛwɔ" : "Ask about exams, prices, DVLA, or eye symptoms") 
                        : (lang === "twi" ? "Fa wo nne kasa kyerɛ NOVA tee" : "Hands-free voice consultation")}
                    </p>
                  </div>
                </div>

                {/* Subtitle / Live Transcript Card */}
                <div className="relative z-10 bg-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 max-h-36 overflow-y-auto space-y-2 text-xs leading-relaxed shadow-lg">
                  {liveTranscript ? (
                    <div className="text-emerald-300 flex items-start gap-1.5 font-medium">
                      <span className="font-bold shrink-0 text-white">{lang === "twi" ? "Wo:" : "You:"}</span>
                      <span className="italic">"{liveTranscript}..."</span>
                    </div>
                  ) : lastUserMessage && !Object.values(INITIAL_GREETINGS).map(g => g.content).includes(lastUserMessage.content) ? (
                    <div className="text-slate-300 flex items-start gap-1.5">
                      <span className="font-bold shrink-0 text-slate-400">{lang === "twi" ? "Wo:" : "You:"}</span>
                      <span className="line-clamp-2">"{lastUserMessage.content}"</span>
                    </div>
                  ) : null}

                  {lastAssistantMessage && (
                    <div className="text-slate-100 flex items-start gap-1.5 pt-1 border-t border-slate-700/40">
                      <span className="font-bold shrink-0 text-teal-400">NOVA:</span>
                      <span className="line-clamp-3 leading-normal">
                        {lastAssistantMessage.content.replace(/[*_#`[\]()]/g, "").slice(0, 220)}...
                      </span>
                    </div>
                  )}

                  {voiceError && (
                    <p className="text-xs text-rose-400 text-center font-medium pt-1">
                      {voiceError}
                    </p>
                  )}
                </div>

                {/* Bottom Control Bar */}
                <div className="relative z-10 pt-4 flex items-center justify-around border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      if (isMuted) {
                        setIsMuted(false);
                        startListening();
                      } else {
                        setIsMuted(true);
                        stopListening();
                      }
                    }}
                    aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
                      isMuted ? "text-rose-400 bg-rose-500/10" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center border ${
                      isMuted ? "border-rose-500 bg-rose-500/20" : "border-slate-700 bg-slate-800"
                    }`}>
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </div>
                    <span className="text-[10px] font-medium">{isMuted ? (lang === "twi" ? "Bue" : "Unmute") : (lang === "twi" ? "To mu" : "Mute")}</span>
                  </button>

                  {isSpeakingVoice && (
                    <button
                      onClick={interruptSpeaking}
                      aria-label="Interrupt NOVA Voice"
                      className="flex flex-col items-center gap-1 p-2 text-amber-300 hover:text-amber-200 transition-colors animate-pulse"
                    >
                      <div className="h-11 w-11 rounded-full flex items-center justify-center border border-amber-400/50 bg-amber-500/20">
                        <VolumeX className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold">{lang === "twi" ? "Gyae" : "Interrupt"}</span>
                    </button>
                  )}

                  <button
                    onClick={exitVoiceMode}
                    aria-label="Switch to Text View"
                    className="flex flex-col items-center gap-1 p-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="h-11 w-11 rounded-full flex items-center justify-center border border-slate-700 bg-slate-800">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">{lang === "twi" ? "Atwerɛ" : "Text Chat"}</span>
                  </button>

                  <button
                    onClick={exitVoiceMode}
                    aria-label="End Voice Call"
                    className="flex flex-col items-center gap-1 p-2 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <div className="h-11 w-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white shadow-lg">
                      <PhoneOff className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold">{lang === "twi" ? "Gyae Call" : "End Call"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* =================== TEXT CHAT MODE =================== */
              <>
                <div className="bg-muted/60 border-b border-border/50 px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0">
                  <button
                    onClick={enterVoiceMode}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline transition-all"
                  >
                    <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                    <span>{lang === "twi" ? "🇬🇭 Kasa Twi wɔ Nne So" : "Talk with Voice Agent"}</span>
                  </button>

                  <a
                    href="tel:0544172089"
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors text-[11px]"
                  >
                    <Phone className="h-3 w-3 text-emerald-500" /> 0544172089
                  </a>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                  {messages.map((m, i) => {
                    const isAssistant = m.role === "assistant";
                    const containsBooking = isAssistant && (
                      m.content.toLowerCase().includes("book") || 
                      m.content.toLowerCase().includes("appointment") ||
                      m.content.toLowerCase().includes("beaeɛ to hɔ")
                    );
                    const containsLocation = isAssistant && (
                      m.content.toLowerCase().includes("abuakwa") || 
                      m.content.toLowerCase().includes("address") ||
                      m.content.toLowerCase().includes("beaeɛ")
                    );

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

                        {isAssistant && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 ml-1 text-xs">
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
                                <><VolumeX className="h-3 w-3" /> {lang === "twi" ? "Gyae Nne" : "Stop Voice"}</>
                              ) : (
                                <><Volume2 className="h-3 w-3" /> {lang === "twi" ? "Tie Nne" : "Listen"}</>
                              )}
                            </button>

                            {containsBooking && (
                              <button
                                onClick={() => { setOpen(false); navigate("/book"); }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-white transition-all shadow-xs"
                              >
                                <CalendarPlus className="h-3 w-3" /> {lang === "twi" ? "Fa Beaeɛ To Hɔ" : "Book Appointment"}
                              </button>
                            )}

                            {containsLocation && (
                              <a
                                href="https://maps.google.com/?q=NOVA+Eye+Care+Services+Abuakwa"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                              >
                                <MapPin className="h-3 w-3" /> {lang === "twi" ? "Hwɛ Mape So" : "View Map"}
                              </a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {loading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start items-center gap-2"
                    >
                      <div className="bg-card border border-border/80 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-primary animate-bounce" /> {lang === "twi" ? "NOVA redwene ho" : "NOVA is thinking"}
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
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                          {lang === "twi" ? "Nsɛmmisa a Wɔtaa Bisa:" : "Suggested Questions:"}
                        </p>
                        <button
                          onClick={enterVoiceMode}
                          className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <Mic className="h-3 w-3" /> {lang === "twi" ? "Sɔ Nne Hwɛ" : "Try Voice Mode"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS[lang].map((p, idx) => (
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
                        <CalendarPlus className="h-4 w-4" /> {lang === "twi" ? "Fa Beaeɛ To Hɔ wɔ Intanɛte So" : "Book Appointment Online"}
                      </button>
                    </motion.div>
                  )}
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="border-t border-border p-3 flex items-center gap-2 bg-card shrink-0"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isListening 
                        ? (lang === "twi" ? "Meretie wo nne..." : "Listening to your voice...") 
                        : (lang === "twi" ? "Bisa fa ani nhwehwɛmu, boɔ, mmrɛ..." : "Ask about eye care, prices, hours...")
                    }
                    disabled={loading}
                    className={`flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60 shadow-inner ${
                      isListening ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10" : "border-input"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={toggleTextDictation}
                    title={isListening ? "Stop Listening" : "Voice Dictation"}
                    aria-label="Voice input"
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                      isListening 
                        ? "bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-md" 
                        : "bg-muted/70 text-slate-700 dark:text-slate-200 border-border hover:bg-muted"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-xl h-10 w-10 shadow-sm shrink-0 bg-primary hover:bg-primary/90 text-white" 
                    disabled={loading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
