import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { Plus, Edit2, Trash2, Loader2, Save, X, Image as ImageIcon, ArrowRight, LayoutGrid, List, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type Service = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  displayOrder: number;
};

import { serviceImageMap } from "@/lib/service-images";

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await apiService.services.getAdminAll();
      setServices(data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) {
      toast.error("Name and Slug are required");
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        await apiService.services.create(editing);
        toast.success("Service created successfully");
      } else {
        await apiService.services.update(editing.id, editing);
        toast.success("Service updated successfully");
      }
      setEditing(null);
      setIsNew(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;
    try {
      await apiService.services.delete(id);
      toast.success("Service removed");
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete service");
    }
  };

  return (
    <AdminLayout title="Services Management" subtitle="Dynamic control over NOVA's clinical treatments and packages.">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-muted p-1 rounded-xl">
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("list")}
              className="rounded-lg gap-2"
            >
              <List className="h-4 w-4" /> List
            </Button>
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("grid")}
              className="rounded-lg gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </Button>
          </div>
          
          {!editing && (
            <Button onClick={() => { 
              setIsNew(true); 
              setEditing({ id: crypto.randomUUID(), slug: "", name: "", shortDescription: "", fullDescription: "", imageUrl: "https://images.unsplash.com/photo-1551232864-3f021f1d9316?q=80&w=800", displayOrder: services.length + 1 });
            }} className="gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> New Service
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Form Side */}
              <Card className="lg:col-span-12 lg:col-span-7 p-8 border rounded-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <Badge variant="outline" className="mb-2">{isNew ? "New Service" : "Edit Mode"}</Badge>
                    <h2 className="text-2xl font-bold">{isNew ? "Create Service" : "Edit Service"}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Service Title</label>
                      <Input 
                        value={editing.name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditing({ 
                            ...editing, 
                            name: val,
                            slug: isNew ? val.toLowerCase().replace(/\s+/g, '-') : editing.slug
                          });
                        }}
                        placeholder="e.g. Laser Consultation"
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">URL Reference (Slug)</label>
                      <Input 
                        value={editing.slug} 
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="e.g. laser-consultancy"
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1 flex justify-between items-center">
                        Banner Image
                        {uploading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            value={editing.imageUrl} 
                            onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="h-12 rounded-xl border-border/60 pr-10"
                          />
                          <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                        </div>
                        <div className="relative">
                          <Button 
                            variant="secondary" 
                            className="h-12 rounded-xl h-12 w-12 p-0" 
                            disabled={uploading}
                            asChild
                          >
                            <label className="cursor-pointer">
                              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  try {
                                    setUploading(true);
                                    const { url } = await apiService.media.upload(file);
                                    setEditing({ ...editing, imageUrl: url });
                                    toast.success("Image uploaded successfully");
                                  } catch (error) {
                                    toast.error(error.response?.data?.message || "Upload failed");
                                  } finally {
                                    setUploading(false);
                                  }
                                }} 
                              />
                            </label>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Sort Priority</label>
                      <Input 
                        type="number"
                        value={editing.displayOrder} 
                        onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })}
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Elevator Pitch (Short Summary)</label>
                    <Input 
                      value={editing.shortDescription} 
                      onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
                      placeholder="Appears on cards..."
                      className="h-12 rounded-xl border-border/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Full Clinical Details</label>
                    <Textarea 
                      value={editing.fullDescription} 
                      onChange={(e) => setEditing({ ...editing, fullDescription: e.target.value })}
                      rows={6}
                      placeholder="Detailed explanation of the treatment..."
                      className="rounded-2xl border-border/60 p-4"
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-muted">
                  <Button variant="outline" size="lg" onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-lg px-8">Discard</Button>
                  <Button onClick={handleSave} size="lg" className="rounded-lg px-8 gap-2 font-bold" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Service
                  </Button>
                </div>
              </Card>

              {/* Preview Side */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-2 mb-2 font-bold text-muted-foreground uppercase text-xs tracking-widest pl-2">
                  <Eye className="h-3 w-3" /> Live card preview
                </div>
                <Card className="p-0 overflow-hidden shadow-sm transition-all duration-500 group rounded-xl bg-white opacity-90 pointer-events-none border-dashed border-2">
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    {editing.imageUrl ? (
                      <img 
                        src={serviceImageMap[editing.slug] || editing.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8 opacity-20" /></div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col items-start bg-white">
                    <h2 className="font-bold text-xl md:text-2xl text-foreground mb-3 tracking-tight">
                      {editing.name || "Service Title..."}
                    </h2>
                    <p className="text-muted-foreground/80 mb-6 leading-relaxed text-sm line-clamp-3">
                      {editing.shortDescription || "A captivating description will appear here..."}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      Book this service
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
                <div className="p-6 bg-info-soft rounded-2xl border border-info/10">
                  <p className="text-xs leading-relaxed text-muted-foreground italic">
                    <strong>Tip:</strong> Sorter priority determines where this service appears in the grid. Lower numbers appear first. Use descriptive names for better SEO performance.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}
            >
              {loading ? (
                <div className="py-20 col-span-full flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  <p className="text-sm font-medium animate-pulse">Syncing clinical services...</p>
                </div>
              ) : services.length === 0 ? (
                <Card className="py-32 col-span-full text-center border-dashed border-2 rounded-[2rem] bg-muted/20">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <LayoutGrid className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">No clinical services found</h3>
                  <p className="text-muted-foreground mb-8">Start by defining NOVA's first premium treatment.</p>
                  <Button onClick={() => { setIsNew(true); setEditing({ id: crypto.randomUUID(), slug: "", name: "", shortDescription: "", fullDescription: "", imageUrl: "", displayOrder: 1 }); }} variant="outline" className="rounded-xl">Create your first service</Button>
                </Card>
              ) : (
                services.map((s) => (
                  <motion.div 
                    layout
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {viewMode === "list" ? (
                      <Card className="p-4 hover:shadow-elegant transition-all group border-border/40 hover:border-primary/20 rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="h-20 w-32 shrink-0 rounded-xl bg-muted overflow-hidden border border-border/10 shadow-sm relative">
                            <img 
                              src={serviceImageMap[s.slug] || s.imageUrl} 
                              alt={s.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                            />
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20 font-bold">#{s.displayOrder}</div>
                          </div>
                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{s.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 truncate">{s.shortDescription}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => setEditing(s)} className="rounded-xl hover:bg-primary-soft hover:text-primary transition-colors border-border/60 h-10 w-10">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="rounded-xl text-destructive hover:bg-destructive/10 transition-colors h-10 w-10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-0 overflow-hidden border-border/40 hover:shadow-elegant transition-all group flex flex-col h-full rounded-2xl relative">
                        <div className="aspect-video relative overflow-hidden">
                          <img 
                            src={serviceImageMap[s.slug] || s.imageUrl} 
                            alt={s.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full border border-white/20 font-bold">#{s.displayOrder}</div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{s.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-grow">{s.shortDescription}</p>
                          <div className="flex gap-2 mt-6 pt-4 border-t border-muted">
                            <Button variant="outline" onClick={() => setEditing(s)} className="flex-1 rounded-lg gap-2 h-9 text-xs font-bold border-border/60">
                              <Edit2 className="h-3.5 w-3.5" /> Details
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(s.id)} className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
