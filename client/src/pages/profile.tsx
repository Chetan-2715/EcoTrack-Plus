import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) { setLocation("/login"); return; }
    setUsername(user.username);
    setAvatarUrl((user as any).avatarUrl || "");
    (async () => {
      const res = await apiRequest("GET", `/api/activity/${user.id}?days=84`);
      const data = await res.json();
      setActivity(data.days || []);
    })();
  }, [user, setLocation]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      const res = await apiRequest("PUT", `/api/users/${user.id}`, { username, avatarUrl });
      const data = await res.json();
      login(data.user);
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    login(null);
    setLocation("/login");
  };

  const weeks = useMemo(() => {
    // transform activity (84 days) into 12 weeks x 7 days grid
    const out: { date: string; count: number }[][] = [];
    for (let i = 0; i < activity.length; i += 7) {
      out.push(activity.slice(i, i + 7));
    }
    return out;
  }, [activity]);

  const colorFor = (count: number) => {
    if (count === 0) return "bg-gray-100";
    if (count < 2) return "bg-emerald-200";
    if (count < 4) return "bg-emerald-300";
    if (count < 6) return "bg-emerald-400";
    return "bg-emerald-500";
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Display name</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Profile photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              <div className="text-xs text-gray-500 mt-1">JPEG/PNG, up to ~2MB</div>
            </div>
          </div>

          <Button onClick={async () => {
            let newUrl = avatarUrl;
            if (avatarFile) {
              // Convert to data URL for demo storage; in production upload to object storage
              const reader = new FileReader();
              const dataUrl: string = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(avatarFile);
              });
              newUrl = dataUrl;
            }
            setAvatarUrl(newUrl);
            await handleSave();
          }} className="eco-gradient-primary text-white">Save changes</Button>

          <div className="flex justify-end">
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              Logout
            </Button>
          </div>

          <div className="mt-8">
            <div className="mb-3 font-semibold">Activity (last 12 weeks)</div>
            <div className="flex gap-1 overflow-x-auto">
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {w.map((d) => (
                    <div key={d.date} title={`${d.date}: ${d.count}`} className={`h-3 w-3 rounded ${colorFor(d.count)}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}