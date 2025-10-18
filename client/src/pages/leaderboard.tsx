import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Leaderboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch leaderboard data
  const { data: leaderboardData } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });

  // Fetch user details for current rank
  const { data: userDetails } = useQuery({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const leaderboard = (leaderboardData as any)?.leaderboard || [];
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getRankCardClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-br from-gray-400 to-gray-600";
      case 3:
        return "bg-gradient-to-br from-amber-600 to-amber-800";
      default:
        return "bg-eco-primary";
    }
  };

  return (
    <main className="py-8 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Eco Leaderboard</h1>
          <p className="text-xl text-gray-600">See how you stack up against other eco-warriors worldwide</p>
        </div>

        {/* Current User Ranking */}
        {userDetails && (userDetails as any)?.user && (
          <Card className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 eco-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">#{(userDetails as any)?.user?.rank}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Current Ranking</h3>
                  <p className="text-gray-600">Keep going! You're doing great! 🌱</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-eco-primary">{(userDetails as any)?.user?.points} points</div>
                <div className="text-sm text-gray-500">Streak: {(userDetails as any)?.user?.streak} days</div>
              </div>
            </div>
          </Card>
        )}

        {/* Top 3 Users */}
        {topThree.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {topThree.map((user: any) => (
              <Card key={user.id} className={`${getRankCardClass(user.rank)} rounded-2xl shadow-lg text-white p-6 text-center transform hover:scale-105 transition-all duration-300`}>
                <CardContent className="p-0">
                  {user.avatarUrl ? (
                    <div className="mx-auto w-24 h-24 mb-4">
                      <img 
                        src={user.avatarUrl} 
                        alt={user.username} 
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-6xl mb-4">{getRankIcon(user.rank) || "🏆"}</div>
                  )}
                  <div className="text-4xl font-bold mb-2">{user.rank === 1 ? "1st" : user.rank === 2 ? "2nd" : "3rd"}</div>
                  <h3 className="text-xl font-bold mb-2">{user.username}</h3>
                  <div className="text-2xl font-bold mb-2">{user.points} pts</div>
                  <div className="bg-white/20 rounded-full px-4 py-2 text-sm inline-block">
                    <Flame className="inline mr-1 h-4 w-4" />
                    {user.streak} day streak
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="eco-gradient-primary p-6 text-white">
            <h2 className="text-2xl font-bold text-center">Global Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {remaining.map((leaderUser: any) => (
              <div key={leaderUser.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {leaderUser.avatarUrl ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-eco-primary/20">
                        <img 
                          src={leaderUser.avatarUrl} 
                          alt={leaderUser.username} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-eco-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-eco-primary font-bold">#{leaderUser.rank}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{leaderUser.username}</h3>
                      <p className="text-sm text-gray-600">
                        <Flame className="inline text-orange-500 mr-1 h-4 w-4" />
                        {leaderUser.streak} day streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-eco-primary">{leaderUser.points} pts</div>
                    <div className="text-sm text-gray-500">Active today</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
