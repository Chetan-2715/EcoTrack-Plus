import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { User, Recycle, Train, Lightbulb, Droplet } from "lucide-react";
import HabitCard from "@/components/habit-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Habit increment mutation
  const incrementHabitMutation = useMutation({
    mutationFn: async ({ habitType }: { habitType: string }) => {
      const response = await apiRequest("POST", `/api/habits/${user?.id}`, {
        habitType,
        increment: 1,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user points in auth context
      if (data.user) {
        login(data.user);
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id, "today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      
      toast({
        title: "Great job!",
        description: "Your eco-action has been recorded!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update habit",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  const habits = (habitsData as any)?.habits || {};
  const totalActions = Object.values(habits).reduce((sum: number, count: any) => sum + (count || 0), 0);
  const pointsEarned = Object.entries(habits).reduce((sum, [type, count]: [string, any]) => {
    const pointsMap = { recycle: 5, transport: 8, energy: 6, water: 4 };
    return sum + (count || 0) * (pointsMap[type as keyof typeof pointsMap] || 0);
  }, 0);

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Card */}
        <Card className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 eco-gradient-primary rounded-full flex items-center justify-center">
                <User className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {user.username}! 👋
                </h1>
                <p className="text-gray-600">Ready to make a positive impact today?</p>
              </div>
            </div>
            <div className="eco-gradient-primary text-white px-6 py-3 rounded-full text-center">
              <div className="text-sm font-medium">Your Eco Points</div>
              <div className="text-2xl font-bold">{user.points}</div>
            </div>
          </div>
        </Card>

        {/* Habit Tracker Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            onIncrement={() => incrementHabitMutation.mutate({ habitType: "recycle" })}
          />

          <HabitCard
            habitType="transport"
            title="Public Transport"
            description="Log your trips"
            icon={<Train className="text-3xl" />}
            points={8}
            count={habits.transport || 0}
            gradientClass="eco-gradient-sky"
            buttonClass="bg-eco-sky hover:bg-blue-600"
            countColor="text-eco-sky"
            onIncrement={() => incrementHabitMutation.mutate({ habitType: "transport" })}
          />

          <HabitCard
            habitType="energy"
            title="Energy Saving"
            description="Log hours saved"
            icon={<Lightbulb className="text-3xl" />}
            points={6}
            count={habits.energy || 0}
            gradientClass="eco-gradient-earth"
            buttonClass="bg-yellow-500 hover:bg-yellow-600"
            countColor="text-yellow-600"
            onIncrement={() => incrementHabitMutation.mutate({ habitType: "energy" })}
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
            onIncrement={() => incrementHabitMutation.mutate({ habitType: "water" })}
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
    </main>
  );
}
