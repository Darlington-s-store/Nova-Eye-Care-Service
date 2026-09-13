import React, { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiService, KB } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  BookOpen, 
  Edit2, 
  Sparkles, 
  Send, 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

type TestMsg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/chatbot/chat`;

const AdminChatbot = () => {
  const [items, setItems] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<KB> | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"kb" | "sandbox">("kb");

  // Sandbox State
  const [testMessages, setTestMessages] = useState<TestMsg[]>([
    { role: "assistant", content: "Hello! I am NOVA, your clinical AI concierge. Ask me anything to test how I answer patients." }
  ]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const testScrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiService.chatbot.getAllKnowledge();
      setItems(data || []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (testScrollRef.current) {
      testScrollRef.current.scrollTop = testScrollRef.current.scrollHeight;
    }
  }, [testMessages, testLoading]);

  const save = async () => {
    if (!editing?.question || !editing?.answer) { toast.error("Question and answer are required"); return; }
    setSaving(true);
    try {
      await apiService.chatbot.upsertKnowledge({
        id: editing.id,
        question: editing.question,
        answer: editing.answer,
        category: editing.category,
        active: editing.active ?? true,
      });
      toast.success("Saved knowledge entry");
      setEditing(null);
      load();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kb: KB) => {
    try {
      await apiService.chatbot.toggleKnowledge(kb.id);
      load();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry? The chatbot will no longer use it.")) return;
    try {
      await apiService.chatbot.deleteKnowledge(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to delete entry");
    }
  };

  // Sandbox Test Send
  const sendTestMessage = async () => {
    const text = testInput.trim();
    if (!text || testLoading) return;

    const userMsg: TestMsg = { role: "user", content: text };
    const next = [...testMessages, userMsg];
    setTestMessages(next);
    setTestInput("");
    setTestLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setTestMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const apiMessages = next.filter((_, i) => i !== 0); // exclude greeting
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      if (!resp.body) throw new Error("No body");

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
      console.error(e);
      toast.error("Failed to connect to AI assistant endpoint");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <AdminLayout 
      title="Chatbot & Clinical AI Knowledge" 
      subtitle="Manage automated optometric answers and test the Machine Learning patient assistant."
    >
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border/70 pb-3">
        <button
          onClick={() => setActiveTab("kb")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === "kb"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Knowledge Base Catalog ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === "sandbox"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Live AI Sandbox Simulator
        </button>
      </div>

      {activeTab === "kb" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {items.filter(i => i.active).length} Active Entries
              </h2>
              <Button size="sm" className="rounded-xl" onClick={() => setEditing({ question: "", answer: "", category: "", active: true })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add New Entry
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground rounded-2xl">
                No questions added yet — click 'Add New Entry' to provide an answer for patient inquiries.
              </Card>
            ) : (
              items.map((kb) => (
                <Card key={kb.id} className={`p-4 rounded-2xl transition-all ${!kb.active ? "opacity-60 bg-muted/20" : "hover:border-primary/40 shadow-xs"}`}>
                  <div className="flex justify-between gap-3 items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{kb.question}</p>
                        {kb.category && <Badge variant="secondary" className="rounded-md text-[10px] font-bold uppercase">{kb.category}</Badge>}
                        {!kb.active && <Badge variant="outline" className="rounded-md text-[10px] font-bold text-amber-600 border-amber-300">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">{kb.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Switch checked={kb.active} onCheckedChange={() => toggle(kb)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditing(kb)} aria-label="Edit">
                        <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => remove(kb.id)} aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div>
            <Card className="p-5 sticky top-20 border border-border/70 rounded-2xl shadow-sm">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                {editing?.id ? <><Edit2 className="h-4 w-4 text-primary" /> Edit Knowledge Entry</> : editing ? <><Plus className="h-4 w-4 text-primary" /> New Knowledge Entry</> : "Knowledge Base Editor"}
              </h3>
              {!editing ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p>Select any entry from the list to edit, or click <strong>Add New Entry</strong> to train the assistant on a new clinic topic.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <Label htmlFor="q" className="text-xs font-bold uppercase text-slate-500">Patient Question / Inquiry</Label>
                    <Input id="q" value={editing.question ?? ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className="mt-1.5 rounded-xl h-10" placeholder="e.g. Do you test children for lazy eye?" />
                  </div>
                  <div>
                    <Label htmlFor="a" className="text-xs font-bold uppercase text-slate-500">Recommended Answer</Label>
                    <Textarea id="a" value={editing.answer ?? ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} rows={5} className="mt-1.5 rounded-xl text-sm leading-relaxed" placeholder="The comprehensive, professional response to provide..." />
                  </div>
                  <div>
                    <Label htmlFor="cat" className="text-xs font-bold uppercase text-slate-500">Category Tag</Label>
                    <Input id="cat" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1.5 rounded-xl h-10" placeholder="e.g. Services, Pricing, Symptoms, DVLA" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                    <Label className="text-xs font-bold cursor-pointer">{editing.active ?? true ? "Active in Chatbot" : "Disabled"}</Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={save} className="flex-1 rounded-xl h-10 font-bold" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Entry"}
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 font-bold" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Live AI Sandbox Simulator */
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[620px] rounded-2xl overflow-hidden border border-border shadow-sm">
              {/* Header */}
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Interactive Machine Learning Simulator</h4>
                    <p className="text-xs text-muted-foreground">Test how the AI assistant reasons with clinical questions in real time.</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl text-xs h-8"
                  onClick={() => setTestMessages([{ role: "assistant", content: "Conversation reset. You can ask another test question." }])}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              </div>

              {/* Chat History */}
              <div ref={testScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                {testMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-card border border-border text-foreground rounded-bl-none shadow-xs whitespace-pre-wrap"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {testLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground shadow-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Thinking with Machine Learning...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="p-3 bg-card border-t border-border flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTestMessage(); } }}
                  placeholder="Type a test patient inquiry (e.g. 'I have blurry vision and need eye exam pricing')..."
                  disabled={testLoading}
                  className="rounded-xl h-11 text-xs sm:text-sm"
                />
                <Button 
                  onClick={sendTestMessage} 
                  disabled={testLoading || !testInput.trim()} 
                  className="rounded-xl h-11 px-4 font-bold shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 rounded-2xl border border-border shadow-xs">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" /> Quick Test Scenarios
              </h4>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Click any of these scenarios to test how the AI clinical triage and RAG database integration handles them:
              </p>
              <div className="space-y-2">
                {[
                  "I had a chemical splash in my eye at work, what should I do?",
                  "How much is a DVLA eye test for a driver license?",
                  "Where is your clinic located in Abuakwa?",
                  "Can I book an eye test for my 8-year-old child?",
                  "What are your opening hours on Saturday?",
                ].map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setTestInput(scenario); }}
                    className="w-full text-left p-2.5 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-primary/5 text-xs text-slate-700 dark:text-slate-300 transition-all"
                  >
                    "{scenario}"
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border border-border/80 shadow-xs bg-muted/20">
              <h4 className="font-bold text-xs mb-1.5 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <AlertCircle className="h-4 w-4 text-emerald-500" /> Machine Learning Grounding
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All patient inquiries are augmented with live database services, prices, clinic opening hours, GPS address, and your active knowledge catalog before being processed by Google Gemini.
              </p>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminChatbot;
