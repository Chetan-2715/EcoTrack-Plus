import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { User, Recycle, Train, Lightbulb, Droplet, Home, Gift, BarChart2, Trees } from "lucide-react";
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
      // For now, we'll simulate image upload by converting to base64
      let imageUrl = null;
      if (data.imageFile) {
        // In a real app, you'd upload to a service like AWS S3 or Cloudinary
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
    const pointsMap = { recycle: 5, transport: 4, energy: 6, water: 4, trees: 5 }; // Updated transport points
    return sum + (count || 0) * (pointsMap[type as keyof typeof pointsMap] || 0);
  }, 0);

  // Navigation items
  const navItems = [
    { icon: <Home size={28} />, label: "Home", path: "/dashboard" },
    { icon: <User size={28} />, label: "Profile", path: "/profile" },
    { icon: <Gift size={28} />, label: "Rewards", path: "/rewards" },
    { icon: <BarChart2 size={28} />, label: "Stats", path: "/stats" },
  ];

  return (
    <main className="py-8 pb-24">
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
            habitType="energy"
            title="Energy Saving"
            description="Log hours saved"
            icon={<Lightbulb className="text-3xl" />}
            points={6}
            count={habits.energy || 0}
            gradientClass="eco-gradient-earth"
            buttonClass="bg-yellow-500 hover:bg-yellow-600"
            countColor="text-yellow-600"
            onIncrement={() => openForm("energy")}
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

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg flex justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setLocation(item.path)}
            className="group flex flex-col items-center px-4 py-1 focus:outline-none transition-colors"
          >
            <span className="transition-colors group-hover:text-eco-primary text-gray-500">{item.icon}</span>
            <span className="absolute opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded px-2 py-1 mt-10 transition-opacity pointer-events-none z-50">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      
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
