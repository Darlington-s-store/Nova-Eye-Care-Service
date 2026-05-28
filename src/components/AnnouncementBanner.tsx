import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { getCMSContent, Announcements } from "@/lib/cms";

export const AnnouncementBanner = () => {
  const [data, setData] = useState<Announcements | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getCMSContent<Announcements>("announcements");
      if (res && res.enabled && res.message) {
        setData(res);
      }
    })();
  }, []);

  if (!data || !visible) return null;

  return (
    <div className="bg-primary text-white border-b border-white/10 relative z-[60]">
      <div className="container py-2.5 px-4 flex items-center justify-center gap-3 text-center">
        <Megaphone className="h-4 w-4 shrink-0" />
        <p className="text-sm font-bold tracking-tight">{data.message}</p>
        <button 
          onClick={() => setVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
