import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/user-avatar";
import { Edit3, LogOut, Calendar, Trophy, Zap } from "lucide-react";

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

  const handleAvatarChange = async (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    try {
      const res = await apiRequest("PUT", `/api/users/${user.id}`, { username, avatarUrl: newAvatarUrl });
      const data = await res.json();
      login(data.user);
      toast({ title: "Profile photo updated!" });
    } catch (e: any) {
      toast({ title: "Failed to update photo", description: e.message, variant: "destructive" });
    }
  };

  const handleNameEdit = async () => {
    try {
      // Only send the username when editing name to avoid sending large avatar payloads
      const res = await apiRequest("PUT", `/api/users/${user.id}`, { username });
      const data = await res.json();
      login(data.user);
      toast({ title: "Name updated!" });
    } catch (e: any) {
      toast({ title: "Failed to update name", description: e.message, variant: "destructive" });
    }
  };

  const totalActivity = activity.reduce((sum, day) => sum + day.count, 0);
  const streak = activity.filter(day => day.count > 0).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Profile Photo and Name Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Large Profile Photo */}
              <UserAvatar 
                username={username}
                avatarUrl={avatarUrl}
                size="xl"
                showEdit={true}
                onAvatarChange={handleAvatarChange}
                className="ring-4 ring-eco-primary/20"
              />
              
              {/* Editable Name */}
              <div className="w-full">
                <div className="flex items-center justify-center">
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="max-w-xs text-center text-lg font-semibold border border-border rounded-md bg-background"
                    onBlur={handleNameEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                  />
                </div>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-eco-primary">{user.points}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-eco-secondary">{totalActivity}</div>
                  <div className="text-xs text-muted-foreground">Actions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-eco-sky">{streak}</div>
                  <div className="text-xs text-muted-foreground">Active Days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-eco-primary" />
                <h3 className="font-semibold text-foreground">Activity Heatmap</h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Last 12 weeks</div>
                <div className="flex gap-1 overflow-x-auto p-2 bg-muted/20 rounded-lg">
                  {weeks.map((w, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      {w.map((d) => (
                        <div 
                          key={d.date} 
                          title={`${d.date}: ${d.count} actions`} 
                          className={`h-3 w-3 rounded-sm ${colorFor(d.count)} hover:scale-110 transition-transform cursor-pointer`} 
                        />
                      ))}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-sm bg-gray-100" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-200" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-300" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-400" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}