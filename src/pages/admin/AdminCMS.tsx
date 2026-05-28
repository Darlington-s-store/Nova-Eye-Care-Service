import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { 
  Save, 
  Loader2, 
  Layout, 
  Users, 
  Clock, 
  Phone, 
  Megaphone, 
  Plus, 
  Trash2,
  Image as ImageIcon
} from "lucide-react";

interface HeroContent {
  heading: string;
  subheading: string;
  backgroundImage: string;
  cta1: string;
  cta2: string;
}

interface TeamMember {
  name: string;
  title: string;
  bio: string;
  photo: string;
}

interface TeamContent {
  members: TeamMember[];
}

interface ClinicContent {
  name: string;
  tagline: string;
  email: string;
  phone1: string;
  phone2: string;
  address: string;
  mapQuery: string;
}

interface AnnouncementsContent {
  enabled: boolean;
  message: string;
}

interface CMSDataMap {
  hero: HeroContent;
  team: TeamContent;
  clinic: ClinicContent;
  announcements: AnnouncementsContent;
  hours: Record<string, string>;
}

const DEFAULT_CMS: CMSDataMap = {
  hero: { heading: "", subheading: "", backgroundImage: "", cta1: "", cta2: "" },
  team: { members: [] },
  clinic: {
    name: "NOVA Eye Care Services",
    tagline: "See Better! Live Brighter!",
    email: "info@novaeyecareservice.com",
    phone1: "+233544172089",
    phone2: "+233246613184",
    address: "GE20 Dolores St, AH-1192-8485, Kan Royal Filling Station, Abuakwa. GPS address: AH-1192-7988",
    mapQuery: "Kan Royal Filling Station Abuakwa"
  },
  announcements: { enabled: false, message: "" },
  hours: {}
};

type CMSSection = {
  sectionKey: string;
  contentJson: Record<string, unknown>;
};

export default function AdminCMS() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sections, setSections] = useState<CMSDataMap>(DEFAULT_CMS);

  useEffect(() => {
    fetchCMS();
  }, []);

  const fetchCMS = async () => {
    setFetching(true);
    try {
      const data = await apiService.cms.getAll();
      if (data) {
        const cmsData = { ...DEFAULT_CMS };
        data.forEach((s: CMSSection) => {
          const key = s.sectionKey as keyof CMSDataMap;
          if (key in cmsData) {
            (cmsData as Record<string, unknown>)[key] = s.contentJson;
          }
        });
        setSections(cmsData);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to load CMS content");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (key: string) => {
    const sectionKey = key as keyof CMSDataMap;
    const content = sections[sectionKey];
    if (!content) return;

    setLoading(true);
    try {
      await apiService.cms.updateSection(key, content as Record<string, unknown>);
      toast.success(`${key.toUpperCase()} section updated successfully`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const updateSection = <K extends keyof CMSDataMap>(key: K, data: CMSDataMap[K]) => {
    setSections(prev => ({ ...prev, [key]: data }));
  };

  if (fetching) {
    return (
      <AdminLayout title="CMS Management" subtitle="Loading website content settings...">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="font-medium animate-pulse">Syncing content repository...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Management" subtitle="Wysiwyg control over your public website landing pages.">
      <Tabs defaultValue="hero" className="space-y-8">
        <div className="flex justify-between items-center bg-muted p-1 rounded-lg border sticky top-0 z-10 shadow-sm">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger value="hero" className="rounded-md gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Layout className="h-4 w-4" /> Hero
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-md gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-md gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-4 w-4" /> Hours
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-md gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Phone className="h-4 w-4" /> Contact
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-md gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Megaphone className="h-4 w-4" /> Announcements
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="p-8 border rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                Hero Section Configuration
              </h2>
              <Button onClick={() => handleSave("hero")} disabled={loading} className="rounded-lg gap-2 px-8 font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </Button>
            </div>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Main Heading</label>
                <Input 
                  value={sections.hero?.heading || ""} 
                  onChange={(e) => updateSection("hero", { ...sections.hero, heading: e.target.value })}
                  placeholder="Advanced Eye Care for Everyone"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Sub-heading</label>
                <Textarea 
                  value={sections.hero?.subheading || ""} 
                  onChange={(e) => updateSection("hero", { ...sections.hero, subheading: e.target.value })}
                  rows={2}
                  placeholder="We combine expert care with precision technology..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Hero Background Image URL(s)</label>
                <div className="flex gap-4">
                  <Input 
                    value={sections.hero?.backgroundImage || ""} 
                    onChange={(e) => updateSection("hero", { ...sections.hero, backgroundImage: e.target.value })}
                    placeholder="e.g. https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Leave empty to use default high-resolution 4K slideshow. Separate multiple URLs with commas to create a custom slideshow.
                </p>
                {sections.hero?.backgroundImage && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {sections.hero.backgroundImage.split(",")
                      .map(url => url.trim())
                      .filter(Boolean)
                      .map((url, idx) => (
                        <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border bg-muted shadow-sm group">
                          <img 
                            src={url} 
                            alt={`Preview ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&q=50";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[9px] text-white font-bold px-1 text-center truncate w-full">Slide {idx + 1}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">CTA Label 1 (Primary)</label>
                  <Input 
                    value={sections.hero?.cta1 || ""} 
                    onChange={(e) => updateSection("hero", { ...sections.hero, cta1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">CTA Label 2 (Secondary)</label>
                  <Input 
                    value={sections.hero?.cta2 || ""} 
                    onChange={(e) => updateSection("hero", { ...sections.hero, cta2: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Section */}
        <TabsContent value="team">
          <Card className="p-8 border rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Our Medical Experts</h2>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  const currentTeam = sections.team?.members || [];
                  updateSection("team", { ...sections.team, members: [...currentTeam, { name: "", title: "", bio: "", photo: "" }] });
                }} className="rounded-lg gap-2 border-primary/20 text-primary">
                  <Plus className="h-4 w-4" /> Add Member
                </Button>
                <Button onClick={() => handleSave("team")} disabled={loading} className="rounded-lg px-10 font-bold">
                  Save Team
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6">
              {(sections.team?.members as TeamMember[] || []).map((m: TeamMember, idx: number) => (
                <div key={idx} className="p-6 bg-muted/30 rounded-xl border relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 bg-background border text-destructive hover:bg-destructive hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all h-8 w-8"
                    onClick={() => {
                      const newMembers = (sections.team.members as TeamMember[]).filter((_: TeamMember, i: number) => i !== idx);
                      updateSection("team", { ...sections.team, members: newMembers });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 space-y-3">
                      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground overflow-hidden border">
                        {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                      </div>
                      <Input 
                        placeholder="Photo URL" 
                        value={m.photo} 
                        className="text-xs"
                        onChange={(e) => {
                          const newMembers = [...(sections.team.members as TeamMember[])];
                          newMembers[idx].photo = e.target.value;
                          updateSection("team", { ...sections.team, members: newMembers });
                        }}
                      />
                    </div>
                    <div className="md:col-span-9 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input 
                          placeholder="Full Name" 
                          value={m.name} 
                          onChange={(e) => {
                            const newMembers = [...(sections.team.members as TeamMember[])];
                            newMembers[idx].name = e.target.value;
                            updateSection("team", { ...sections.team, members: newMembers });
                          }}
                        />
                        <Input 
                          placeholder="Title / Specialist" 
                          value={m.title} 
                          onChange={(e) => {
                            const newMembers = [...(sections.team.members as TeamMember[])];
                            newMembers[idx].title = e.target.value;
                            updateSection("team", { ...sections.team, members: newMembers });
                          }}
                        />
                      </div>
                      <Textarea 
                        placeholder="Short professional biography..." 
                        rows={3} 
                        value={m.bio} 
                        onChange={(e) => {
                          const newMembers = [...(sections.team.members as TeamMember[])];
                          newMembers[idx].bio = e.target.value;
                          updateSection("team", { ...sections.team, members: newMembers });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours">
          <Card className="p-8 border rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Standard Clinic Hours</h2>
              <Button onClick={() => handleSave("hours")} disabled={loading} className="rounded-lg px-10 font-bold">
                Save Hours
              </Button>
            </div>
            <div className="grid gap-4 max-w-2xl">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex items-center gap-6 p-4 bg-white rounded-2xl border shadow-sm group">
                  <span className="w-32 font-bold">{day}</span>
                  <div className="flex-1 flex gap-3 items-center">
                    <Input 
                      placeholder="e.g. 08:30 AM" 
                      value={sections.hours?.[day] || ""} 
                      onChange={(e) => {
                        const newHours = { ...sections.hours, [day]: e.target.value };
                        updateSection("hours", newHours);
                      }}
                    />
                    <div className="h-0.5 w-4 bg-muted" />
                    <Input 
                      placeholder="e.g. 05:00 PM" 
                      value={sections.hours?.[day + '_to'] || ""} 
                      onChange={(e) => {
                        const newHours = { ...sections.hours, [day + '_to']: e.target.value };
                        updateSection("hours", newHours);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Clinic Contact */}
        <TabsContent value="contact">
          <Card className="p-8 border rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Clinic Contact Information</h2>
              <Button onClick={() => handleSave("clinic")} disabled={loading} className="rounded-lg px-10 font-bold">
                Save Contact
              </Button>
            </div>
            <div className="grid gap-6 max-w-3xl">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Clinic Name</label>
                <Input 
                  value={sections.clinic?.name || ""} 
                  onChange={(e) => updateSection("clinic", { ...sections.clinic, name: e.target.value })}
                  placeholder="NOVA Eye Care Services"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Clinic Tagline</label>
                <Input 
                  value={sections.clinic?.tagline || ""} 
                  onChange={(e) => updateSection("clinic", { ...sections.clinic, tagline: e.target.value })}
                  placeholder="See Better | Live Brighter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Email Address</label>
                <Input 
                  value={sections.clinic?.email || ""} 
                  onChange={(e) => updateSection("clinic", { ...sections.clinic, email: e.target.value })}
                  placeholder="info@novaeyecareservice.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Primary Phone</label>
                  <Input 
                    value={sections.clinic?.phone1 || ""} 
                    onChange={(e) => updateSection("clinic", { ...sections.clinic, phone1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Secondary Phone</label>
                  <Input 
                    value={sections.clinic?.phone2 || ""} 
                    onChange={(e) => updateSection("clinic", { ...sections.clinic, phone2: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Main Address</label>
                <Textarea 
                  value={sections.clinic?.address || ""} 
                  onChange={(e) => updateSection("clinic", { ...sections.clinic, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Google Maps Query (Landmark)</label>
                <Input 
                  value={sections.clinic?.mapQuery || ""} 
                  onChange={(e) => updateSection("clinic", { ...sections.clinic, mapQuery: e.target.value })}
                  placeholder="e.g. Kasapreko PLC Abuakwa Factory"
                />
                <p className="text-xs text-muted-foreground italic px-1">This will be used for the map embed and directions link.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="news">
          <Card className="p-8 border rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Announcement Banner</h2>
              <Button onClick={() => handleSave("announcements")} disabled={loading} className="rounded-lg px-10 font-bold">
                Update Banner
              </Button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold">Show Banner</span>
                  <span className="text-xs text-muted-foreground italic">If enabled, this appears at the top of every page.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={sections.announcements?.enabled || false} 
                  onChange={(e) => updateSection("announcements", { ...sections.announcements, enabled: e.target.checked })}
                  className="h-6 w-6 accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Message Content</label>
                <Textarea 
                  value={sections.announcements?.message || ""} 
                  onChange={(e) => updateSection("announcements", { ...sections.announcements, message: e.target.value })}
                  placeholder="e.g. Due to public holiday, we are closed on Monday, 1st May."
                  rows={2}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

      </Tabs>
    </AdminLayout>
  );
}
