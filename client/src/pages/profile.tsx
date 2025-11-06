import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/user-avatar";
import { Edit3, LogOut, Calendar, Trophy, Zap, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ActivityHeatmapSkeleton } from "@/components/activity-heatmap-skeleton";

export default function Profile() {
  const { user, login, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ["/api/activity", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/activity/${user!.id}?days=84`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  type ActivityDay = { date: string; count: number };
  const activity: ActivityDay[] = activityData?.days || [];

  const weeks = useMemo(() => {
    // transform activity (84 days) into 12 weeks x 7 days grid
    const out: ActivityDay[][] = [];
    for (let i = 0; i < activity.length; i += 7) {
      out.push(activity.slice(i, i + 7));
    }
    return out;
  }, [activity]);

  const totalActivity = activity.reduce((sum: number, day: ActivityDay) => sum + day.count, 0);
  const streak = activity.filter((day: ActivityDay) => day.count > 0).length;

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

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
    logout(); // Use the logout function from context
    setLocation("/login");
  };

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
      const payload = newAvatarUrl === "" 
        ? { username, removeAvatar: true } 
        : { username, avatarUrl: newAvatarUrl };
      const res = await apiRequest("PUT", `/api/users/${user.id}`, payload);
      const data = await res.json();
      login(data.user);
      toast({ title: newAvatarUrl === "" ? "Profile photo removed!" : "Profile photo updated!" });
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

  const handleDeleteProfile = async () => {
    try {
      const res = await apiRequest("DELETE", `/api/users/${user.id}`, { password: deletePassword });
      if (res.ok) {
        toast({ title: "Profile deleted successfully." });
        await supabase.auth.signOut();
        logout(); // Use the logout function from context
        setLocation("/login");
      } else {
        const errorData = await res.json();
        toast({ title: "Failed to delete profile", description: errorData.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Failed to delete profile", description: e.message, variant: "destructive" });
    } finally {
      setShowDeleteDialog(false);
      setDeletePassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
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
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <Card className="mb-6 md:mb-0 md:flex-1">
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
                  
                  {/* Date Joined */}
                  {(user as any).createdAt && (
                    <div className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Joined {new Date((user as any).createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
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
          <Card className="md:flex-1">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-eco-primary" />
                  <h3 className="font-semibold text-foreground">Activity Heatmap</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Last 12 weeks (84 days)</div>
                  <div className="flex gap-1 overflow-x-auto p-2 bg-muted/20 rounded-lg">
                    {weeks.length > 0 ? weeks.map((w, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        {w.map((d) => {
                          const dateObj = new Date(d.date);
                          const formattedDate = dateObj.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          });
                          return (
                            <div 
                              key={d.date} 
                              title={`${formattedDate}: ${d.count} ${d.count === 1 ? 'action' : 'actions'}`} 
                              className={`h-3 w-3 rounded-sm ${colorFor(d.count)} hover:scale-125 hover:ring-2 hover:ring-eco-primary transition-all cursor-pointer`} 
                            />
                          );
                        })}
                      </div>
                    )) : (
                      <ActivityHeatmapSkeleton />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>Less</span>
                    <div className="flex space-x-1 items-center">
                      <div className="h-3 w-3 rounded-sm bg-gray-100 border border-gray-200" title="0 actions" />
                      <div className="h-3 w-3 rounded-sm bg-emerald-200" title="1-2 actions" />
                      <div className="h-3 w-3 rounded-sm bg-emerald-300" title="3-4 actions" />
                      <div className="h-3 w-3 rounded-sm bg-emerald-400" title="5-6 actions" />
                      <div className="h-3 w-3 rounded-sm bg-emerald-500" title="7+ actions" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Profile Button */}
                  <Button 
                    variant="destructive" 
                    className="flex items-center space-x-2 mr-auto"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Profile</span>
                  </Button>
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers. Please enter your password to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mt-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProfile} 
                disabled={!deletePassword}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete My Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
