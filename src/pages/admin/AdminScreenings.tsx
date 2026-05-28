import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { apiService } from "@/lib/api";
import { generateScreeningPDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { 
  Eye, 
  Plus, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  User, 
  Loader2,
  Edit2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Screening = {
  id: string;
  patientId: string;
  screeningDate: string;
  diagnosis: string;
  vaRightEye: string;
  vaLeftEye: string;
  iopRight: number;
  iopLeft: number;
  recommendedFollowup: string;
  isVisibleToPatient: boolean;
  patientName: string;
  colourVisionResult?: string;
};

export default function AdminScreenings() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // New Screening State
  const [newScreening, setNewScreening] = useState({
    patientId: "",
    vaRightEye: "",
    vaLeftEye: "",
    iopRight: "",
    iopLeft: "",
    colourVisionResult: "",
    diagnosis: "",
    recommendedFollowup: "",
    isVisibleToPatient: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const [patients, setPatients] = useState<{id: string, fullName: string}[]>([]);

  useEffect(() => {
    fetchScreenings();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await apiService.profiles.getAll();
      if (data) setPatients(data);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  const fetchScreenings = async () => {
    setLoading(true);
    try {
      const data = await apiService.medical.getAllScreenings();
      setScreenings(data || []);
    } catch (err) {
      toast.error("Failed to load screening records");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewScreening({
      patientId: "",
      vaRightEye: "",
      vaLeftEye: "",
      iopRight: "",
      iopLeft: "",
      colourVisionResult: "",
      diagnosis: "",
      recommendedFollowup: "",
      isVisibleToPatient: true
    });
    setEditingId(null);
  };

  const handleEditClick = (s: Screening) => {
    setEditingId(s.id);
    setNewScreening({
      patientId: s.patientId,
      vaRightEye: s.vaRightEye || "",
      vaLeftEye: s.vaLeftEye || "",
      iopRight: s.iopRight ? s.iopRight.toString() : "",
      iopLeft: s.iopLeft ? s.iopLeft.toString() : "",
      colourVisionResult: s.colourVisionResult || "",
      diagnosis: s.diagnosis || "",
      recommendedFollowup: s.recommendedFollowup || "",
      isVisibleToPatient: s.isVisibleToPatient
    });
    setIsRecording(true);
  };

  const handleCreateScreening = async () => {
    if (!newScreening.patientId) {
      toast.error("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      await apiService.medical.createScreening({
        patientId: newScreening.patientId,
        vaRight: newScreening.vaRightEye,
        vaLeft: newScreening.vaLeftEye,
        iopRight: parseFloat(newScreening.iopRight) || 0,
        iopLeft: parseFloat(newScreening.iopLeft) || 0,
        colourVision: newScreening.colourVisionResult,
        diagnosis: newScreening.diagnosis,
        followup: newScreening.recommendedFollowup,
        isVisible: newScreening.isVisibleToPatient
      });
      toast.success("Health screening record saved successfully");
      setIsRecording(false);
      resetForm();
      fetchScreenings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScreening = async () => {
    if (!editingId) return;
    if (!newScreening.patientId) {
      toast.error("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      await apiService.medical.updateScreening(editingId, {
        patientId: newScreening.patientId,
        vaRight: newScreening.vaRightEye,
        vaLeft: newScreening.vaLeftEye,
        iopRight: parseFloat(newScreening.iopRight) || 0,
        iopLeft: parseFloat(newScreening.iopLeft) || 0,
        colourVision: newScreening.colourVisionResult,
        diagnosis: newScreening.diagnosis,
        followup: newScreening.recommendedFollowup,
        isVisible: newScreening.isVisibleToPatient
      });
      toast.success("Health screening record updated successfully");
      setIsRecording(false);
      resetForm();
      fetchScreenings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Eye Screenings" subtitle="Clinical diagnostics and patient health recording.">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96 group">
            <Input 
              placeholder="Search by patient name or diagnosis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/40 shadow-sm focus:ring-primary/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 group-focus-within:text-primary transition-colors" />
          </div>

          <Dialog open={isRecording} onOpenChange={(open) => {
            setIsRecording(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="rounded-lg gap-2 px-6 h-11 font-bold">
                <Plus className="h-4 w-4" /> New Diagnosis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-xl p-8 border shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  {editingId ? "Edit Eye Screening Record" : "New Eye Screening Record"}
                </DialogTitle>
                <DialogDescription>
                  {editingId ? "Modify clinical findings for this patient's visit." : "Enter clinical findings for the patient's current visit."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Selection</label>
                  <select 
                    className="w-full h-11 rounded-lg border bg-background px-3 outline-none focus:ring-1 focus:ring-primary transition-all font-medium disabled:opacity-50"
                    value={newScreening.patientId}
                    disabled={!!editingId}
                    onChange={(e) => setNewScreening({...newScreening, patientId: e.target.value})}
                  >
                    <option value="">Choose a registered patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-muted rounded-lg border">
                    <h3 className="text-xs font-bold text-primary uppercase">Right Eye (OD)</h3>
                    <Input placeholder="Visual Acuity" value={newScreening.vaRightEye} onChange={e => setNewScreening({...newScreening, vaRightEye: e.target.value})} className="bg-background border shadow-none" />
                    <Input placeholder="IOP (mmHg)" type="number" value={newScreening.iopRight} onChange={e => setNewScreening({...newScreening, iopRight: e.target.value})} className="bg-background border shadow-none" />
                  </div>
                  <div className="space-y-4 p-4 bg-muted rounded-lg border">
                    <h3 className="text-xs font-bold text-primary uppercase">Left Eye (OS)</h3>
                    <Input placeholder="Visual Acuity" value={newScreening.vaLeftEye} onChange={e => setNewScreening({...newScreening, vaLeftEye: e.target.value})} className="bg-background border shadow-none" />
                    <Input placeholder="IOP (mmHg)" type="number" value={newScreening.iopLeft} onChange={e => setNewScreening({...newScreening, iopLeft: e.target.value})} className="bg-background border shadow-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Clinical Assessment</label>
                  <Textarea placeholder="Diagnosis & Impression..." rows={3} value={newScreening.diagnosis} onChange={e => setNewScreening({...newScreening, diagnosis: e.target.value})} />
                  <Textarea placeholder="Recommended Follow-up..." rows={2} value={newScreening.recommendedFollowup} onChange={e => setNewScreening({...newScreening, recommendedFollowup: e.target.value})} />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isVisibleToPatient" 
                    checked={newScreening.isVisibleToPatient} 
                    onChange={e => setNewScreening({...newScreening, isVisibleToPatient: e.target.checked})} 
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="isVisibleToPatient" className="text-sm font-medium text-foreground select-none cursor-pointer">
                    Visible to patient in portal
                  </label>
                </div>
              </div>

              <DialogFooter className="mt-8">
                <Button variant="outline" onClick={() => setIsRecording(false)} className="rounded-lg">Discard</Button>
                <Button onClick={editingId ? handleUpdateScreening : handleCreateScreening} disabled={loading} className="rounded-lg px-8 font-bold gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {editingId ? "Update Medical Record" : "Save Medical Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Screening Table */}
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-sm font-medium animate-pulse">Consulting medical database...</p>
            </div>
          ) : screenings.length === 0 ? (
            <div className="p-20 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground"><Eye className="h-8 w-8" /></div>
              <h3 className="font-bold text-lg">No screening records yet</h3>
              <p className="text-muted-foreground">Clinical history will appear here once examinations are performed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-muted">
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Diagnosis</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">V.A (OD/OS)</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Visibility</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/40">
                  {screenings.filter(s => 
                    s.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((s) => (
                    <tr key={s.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs"><User className="h-4 w-4" /></div>
                          <span className="font-bold text-foreground">{s.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-muted-foreground">{new Date(s.screeningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium line-clamp-1">{s.diagnosis || "No diagnosis recorded"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-muted/50 border-0">{s.vaRightEye || '-'}</Badge>
                          <Badge variant="outline" className="bg-muted/50 border-0">{s.vaLeftEye || '-'}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`${s.isVisibleToPatient ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'} border-0 px-3`}>
                          {s.isVisibleToPatient ? 'Patient Visible' : 'Internal Only'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => generateScreeningPDF({
                              patientName: s.patientName,
                              screeningDate: s.screeningDate,
                              vaRight: s.vaRightEye,
                              vaLeft: s.vaLeftEye,
                              iopRight: s.iopRight,
                              iopLeft: s.iopLeft,
                              diagnosis: s.diagnosis,
                              followup: s.recommendedFollowup
                            })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => handleEditClick(s)}
                            title="Edit Record"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
