import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Recycle, Train, Droplet, Trees } from "lucide-react";
import HabitCard from "@/components/habit-card";
import { HabitForm } from "@/components/habit-forms";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeForm, setActiveForm] = useState<'recycle' | 'transport' | 'energy' | 'water' | 'trees' | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      
      const needsVerification = data.habit?.verified === 0;
      toast({
        title: needsVerification ? "Submitted for review!" : "Great job!",
        description: needsVerification 
          ? "Your action will be reviewed and points awarded after verification."
          : "Your eco-action has been recorded!",
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
  
  const openForm = (habitType: 'recycle' | 'transport' | 'energy' | 'water' | 'trees') => {
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
      </div>

      
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
