import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Recycle, Train, Droplet, Trees, History, Calendar, Image as ImageIcon } from "lucide-react";
import HabitCard from "@/components/habit-card";
import { HabitForm } from "@/components/habit-forms";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Dashboard() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeForm, setActiveForm] = useState<'recycle' | 'transport' | 'water' | 'trees' | null>(null);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch user details
  const { data: userDetails } = useQuery({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  // Fetch today's habits
  const { data: habitsData } = useQuery({
    queryKey: ["/api/habits", user?.id, "today"],
    enabled: !!user?.id,
  });

  // Fetch action history
  const { data: historyData } = useQuery({
    queryKey: ["/api/habits", user?.id, "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/habits/${user?.id}/history?limit=20`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Habit submission mutation
  const submitHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use compressed image if available, otherwise compress on the fly
      let imageUrl = data.imageUrl; // This comes pre-compressed from the form
      
      if (!imageUrl && data.imageFile) {
        // Fallback: compress if not already done
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(data.imageFile);
        });
        imageUrl = base64 as string;
      }
      
      const response = await apiRequest("POST", `/api/habits/${user?.id}`, {
        habitType: data.habitType,
        increment: 1,
        distance: data.distance,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        recycledItem: data.recycledItem,
        imageUrl,
        description: data.description,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user points in auth context
      if (data.user) {
        login(data.user);
      }
      // Close the form
      setActiveForm(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id, "today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id, "history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      
      toast({
        title: "Great job!",
        description: "Your eco-action has been recorded and points awarded!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit habit",
        variant: "destructive",
      });
    },
  });
  
  const openForm = (habitType: 'recycle' | 'transport' | 'water' | 'trees') => {
    setActiveForm(habitType);
  };

  if (!user) {
    return null;
  }

  const habits = (habitsData as any)?.habits || {};
  const totalActions = Object.values(habits).reduce((sum: number, count: any) => sum + (count || 0), 0);
  const pointsEarned = Object.entries(habits).reduce((sum, [type, count]: [string, any]) => {
    const pointsMap = { recycle: 5, transport: 4, water: 4, trees: 5 }; // Updated transport points
    return sum + (count || 0) * (pointsMap[type as keyof typeof pointsMap] || 0);
  }, 0);


  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        {/* Habit Tracker Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HabitCard
            habitType="recycle"
            title="Recycle"
            description="Track daily recycling"
            icon={<Recycle className="text-3xl" />}
            points={5}
            count={habits.recycle || 0}
            gradientClass="eco-gradient-primary"
            buttonClass="bg-eco-secondary hover:bg-eco-primary"
            countColor="text-eco-primary"
            onIncrement={() => openForm("recycle")}
          />

          <HabitCard
            habitType="transport"
            title="Public Transport"
            description="Log your trips"
            icon={<Train className="text-3xl" />}
            points="1-4"
            count={habits.transport || 0}
            gradientClass="eco-gradient-sky"
            buttonClass="bg-eco-sky hover:bg-blue-600"
            countColor="text-eco-sky"
            onIncrement={() => openForm("transport")}
          />


          <HabitCard
            habitType="water"
            title="Water Usage"
            description="Log liters saved"
            icon={<Droplet className="text-3xl" />}
            points={4}
            count={habits.water || 0}
            gradientClass="eco-gradient-water"
            buttonClass="bg-blue-500 hover:bg-blue-600"
            countColor="text-blue-600"
            onIncrement={() => openForm("water")}
          />

          <HabitCard
            habitType="trees"
            title="Plant Trees"
            description="Log planted trees"
            icon={<Trees className="text-3xl" />}
            points={5}
            count={habits.trees || 0}
            gradientClass="eco-gradient-forest"
            buttonClass="bg-green-600 hover:bg-green-700"
            countColor="text-green-600"
            onIncrement={() => openForm("trees")}
          />
        </div>

        {/* Progress Summary */}
        <Card className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress Today</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-primary mb-2">{totalActions}</div>
              <div className="text-gray-600">Total Actions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-secondary mb-2">+{pointsEarned}</div>
              <div className="text-gray-600">Points Earned Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-sky mb-2">{(userDetails as any)?.user?.streak || 0}</div>
              <div className="text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-earth mb-2">#{(userDetails as any)?.user?.rank || 0}</div>
              <div className="text-gray-600">Global Rank</div>
            </div>
          </div>
        </Card>

        {/* Action History */}
        <Card className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-6 h-6 text-eco-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Action History</h2>
            </div>
            
            {(historyData as any)?.history?.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(historyData as any).history.map((action: any) => {
                  const getHabitIcon = (type: string) => {
                    switch (type) {
                      case 'recycle': return <Recycle className="w-5 h-5 text-eco-primary" />;
                      case 'transport': return <Train className="w-5 h-5 text-eco-sky" />;
                      case 'water': return <Droplet className="w-5 h-5 text-blue-600" />;
                      case 'trees': return <Trees className="w-5 h-5 text-green-600" />;
                      default: return null;
                    }
                  };

                  const getHabitTitle = (type: string) => {
                    switch (type) {
                      case 'recycle': return 'Recycled';
                      case 'transport': return 'Public Transport';
                      case 'water': return 'Water Saved';
                      case 'trees': return 'Planted Trees';
                      default: return type;
                    }
                  };

                  const formattedDate = new Date(action.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={action.id}
                      onClick={() => setSelectedAction(action)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getHabitIcon(action.habitType)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{getHabitTitle(action.habitType)}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {action.imageUrl && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-semibold text-eco-primary">+{action.pointsEarned} pts</div>
                          <div className="text-xs text-gray-500">×{action.count}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No actions yet. Start tracking your eco-activities!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Detail Modal */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Action Details</DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-4">
              {/* Date */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Date</div>
                <div className="text-gray-900">
                  {new Date(selectedAction.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Action Type</div>
                <div className="text-gray-900 capitalize">{selectedAction.habitType}</div>
              </div>

              {/* Points & Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Points Earned</div>
                  <div className="text-2xl font-bold text-eco-primary">+{selectedAction.pointsEarned}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Count</div>
                  <div className="text-2xl font-bold text-gray-900">×{selectedAction.count}</div>
                </div>
              </div>

              {/* Description */}
              {selectedAction.description && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Description</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAction.description}</div>
                </div>
              )}

              {/* Transport Details */}
              {selectedAction.habitType === 'transport' && selectedAction.distance && (
                <>
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">Distance</div>
                    <div className="text-gray-900">{selectedAction.distance} km</div>
                  </div>
                  {selectedAction.startLocation && selectedAction.endLocation && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Route</div>
                      <div className="text-gray-900">
                        {selectedAction.startLocation} → {selectedAction.endLocation}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Recycled Item */}
              {selectedAction.habitType === 'recycle' && selectedAction.recycledItem && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Recycled Item</div>
                  <div className="text-gray-900">{selectedAction.recycledItem}</div>
                </div>
              )}

              {/* Image */}
              {selectedAction.imageUrl && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Verification Photo</div>
                  <img
                    src={selectedAction.imageUrl}
                    alt="Action verification"
                    className="w-full rounded-lg border border-gray-200 object-cover max-h-64"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Habit Forms */}
      {activeForm && (
        <HabitForm
          habitType={activeForm}
          isOpen={!!activeForm}
          onClose={() => setActiveForm(null)}
          onSubmit={(data) => submitHabitMutation.mutate(data)}
          isLoading={submitHabitMutation.isPending}
        />
      )}
    </main>
  );
}
