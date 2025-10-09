import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Check, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Rewards() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch all rewards
  const { data: rewardsData } = useQuery({
    queryKey: ["/api/rewards"],
  });

  // Fetch user's claimed rewards
  const { data: userRewardsData } = useQuery({
    queryKey: ["/api/rewards", user?.id, "claimed"],
    enabled: !!user?.id,
  });

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await apiRequest("POST", `/api/rewards/${user?.id}/claim/${rewardId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards", user?.id, "claimed"] });
      toast({
        title: "Reward claimed!",
        description: "Congratulations on your achievement!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim reward",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  const rewards = (rewardsData as any)?.rewards || [];
  const claimedRewards = (userRewardsData as any)?.userRewards || [];
  const claimedRewardIds = new Set(claimedRewards.map((ur: any) => ur.rewardId));

  const getRewardStatus = (reward: any) => {
    if (claimedRewardIds.has(reward.id)) {
      return { status: 'claimed', label: 'Claimed!', icon: Check };
    }
    if (user.points >= reward.pointsRequired) {
      return { status: 'available', label: 'Claim Reward', icon: Check };
    }
    const needed = reward.pointsRequired - user.points;
    return { status: 'locked', label: `${needed} more needed`, icon: Lock };
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "bg-gradient-to-br from-eco-secondary to-eco-primary",
      "bg-gradient-to-br from-eco-primary to-eco-forest",
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-yellow-500 to-orange-500",
      "bg-gradient-to-br from-green-600 to-blue-600",
      "bg-gradient-to-br from-indigo-600 to-purple-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <main className="py-8 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Eco Rewards</h1>
          <p className="text-xl text-muted-foreground mb-6">Unlock amazing rewards as you progress on your eco journey</p>
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
            <Coins className="text-eco-primary text-xl mr-3" />
            <span className="text-lg font-semibold text-gray-700">Your Points: </span>
            <span className="text-2xl font-bold text-eco-primary ml-2">{user.points}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rewards.map((reward: any, index: number) => {
            const rewardStatus = getRewardStatus(reward);
            const isLocked = rewardStatus.status === 'locked';
            const isClaimed = rewardStatus.status === 'claimed';
            const StatusIcon = rewardStatus.icon;

            return (
              <Card key={reward.id} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100 relative ${isLocked ? 'opacity-75' : ''}`}>
                {isLocked && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    Locked
                  </div>
                )}
                {isClaimed && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    Claimed
                  </div>
                )}
                <div className={`${getGradientClass(index)} p-6 text-white text-center ${isLocked ? 'opacity-75' : ''}`}>
                  <div className="text-6xl mb-4">{reward.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{reward.name}</h3>
                  <div className="flex items-center justify-center">
                    <Coins className="mr-2" />
                    <span className="text-xl font-semibold">{reward.pointsRequired} Points</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-6 leading-relaxed">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Required: {reward.pointsRequired} pts</span>
                    <Button
                      onClick={() => !isClaimed && !isLocked && claimRewardMutation.mutate(reward.id)}
                      disabled={isLocked || isClaimed || claimRewardMutation.isPending}
                      className={`${
                        isClaimed 
                          ? 'bg-green-500 hover:bg-green-500' 
                          : isLocked 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-eco-primary hover:bg-eco-forest'
                      } text-white px-6 py-2 rounded-full font-semibold transition-colors duration-200`}
                    >
                      <StatusIcon className="mr-2 h-4 w-4" />
                      {rewardStatus.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
