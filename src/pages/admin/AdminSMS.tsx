import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService, SMSLog, SMSStats } from "@/lib/api";
import { Send, History, BarChart3, Loader2, Search, CheckCircle, XCircle, Clock, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSMS() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState<"all" | string[]>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        apiService.sms.getLogs(),
        apiService.sms.getStats()
      ]);
      setLogs(logsData || []);
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to fetch SMS data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const result = await apiService.sms.sendBulk({ message, recipients });
      toast.success(result.message);
      setMessage("");
      fetchData();
    } catch (error: unknown) {
      let errorMsg = "Failed to send bulk SMS";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMsg = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.phone.includes(searchTerm) || 
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="SMS Communication" subtitle="Manage patient alerts, bulk notifications, and track delivery status.">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-none shadow-elegant bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Send className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Total Messages</h3>
            </div>
            <p className="text-4xl font-black tracking-tight">{stats?.total || 0}</p>
          </Card>

          <Card className="p-6 border-none shadow-elegant bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-green-500">
              <CheckCircle className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Successfully Sent</h3>
            </div>
            <p className="text-4xl font-black tracking-tight text-green-600">{stats?.sent || 0}</p>
          </Card>

          <Card className="p-6 border-none shadow-elegant bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-destructive">
              <XCircle className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Failed Delivery</h3>
            </div>
            <p className="text-4xl font-black tracking-tight text-destructive">{stats?.failed || 0}</p>
          </Card>
        </div>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="bg-muted p-1 rounded-xl mb-6">
            <TabsTrigger value="compose" className="rounded-lg gap-2 data-[state=active]:bg-white">
              <Send className="h-4 w-4" /> Compose Bulk
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 data-[state=active]:bg-white">
              <History className="h-4 w-4" /> Message History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <Card className="p-8 border-none shadow-elegant rounded-2xl max-w-4xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Bulk Notification</h2>
                  <p className="text-sm text-muted-foreground mt-1">Send a broadcast message to your patient database.</p>
                </div>
                <Users className="h-10 w-10 text-primary opacity-20" />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Recipients</label>
                  <div className="flex gap-4">
                    <Button 
                      variant={recipients === "all" ? "default" : "outline"} 
                      onClick={() => setRecipients("all")}
                      className="rounded-xl px-8"
                    >
                      All Patients
                    </Button>
                    <Button 
                      variant={Array.isArray(recipients) ? "default" : "outline"} 
                      onClick={() => setRecipients([])}
                      disabled
                      className="rounded-xl px-8"
                    >
                      Selected Group (Coming Soon)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-bold">Message Content</label>
                    <span className={`text-[10px] font-bold ${message.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {message.length} / 160 characters (1 SMS unit)
                    </span>
                  </div>
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your clinical update or announcement here..."
                    rows={6}
                    className="rounded-2xl border-border/60 p-6 text-lg leading-relaxed focus-visible:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground italic mt-2">
                    * Standard rates apply via Arkesel. Messages over 160 characters will be split into multiple SMS units.
                  </p>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Scheduled for: Immediate delivery
                  </div>
                  <Button 
                    onClick={handleSendBulk} 
                    disabled={sending || !message.trim()}
                    size="lg"
                    className="rounded-xl px-12 gap-2 font-bold shadow-lg shadow-primary/20"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Broadcast SMS
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-none shadow-elegant rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-muted bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search phone numbers or content..."
                    className="pl-10 rounded-xl border-border/40 h-11"
                  />
                </div>
                <Button variant="ghost" onClick={fetchData} size="sm" className="gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Recipient</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Sent Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                          <td className="p-4"><div className="h-4 w-64 bg-muted rounded"></div></td>
                          <td className="p-4 text-center"><div className="h-4 w-16 bg-muted rounded mx-auto"></div></td>
                          <td className="p-4 text-right"><div className="h-4 w-32 bg-muted rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-muted-foreground">
                          <History className="h-10 w-10 mx-auto mb-4 opacity-20" />
                          <p>No SMS history found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                          <td className="p-4 font-bold text-sm">{log.phone}</td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground/90 line-clamp-2 max-w-lg">{log.message}</p>
                          </td>
                          <td className="p-4 text-center">
                            {log.status === 'sent' ? (
                              <Badge className="bg-green-500/10 text-green-600 border-none rounded-lg font-bold uppercase text-[10px]">Delivered</Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none rounded-lg font-bold uppercase text-[10px]">Failed</Badge>
                            )}
                          </td>
                          <td className="p-4 text-right text-xs text-muted-foreground font-medium">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
