import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "../lib/auth";
import { 
  Leaf, 
  TrendingUp, 
  Trophy, 
  Users, 
  Globe,
  Recycle,
  Train,
  Lightbulb,
  Droplet,
  Rocket,
  Info
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-eco-mint/10 via-white to-eco-primary/5"></div>
        <div className="absolute inset-0 opacity-5 eco-bg-pattern"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Track Your Habits.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-primary to-eco-secondary">
                {" "}Save the Planet 🌍
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Join thousands of eco-warriors making a difference. Track your sustainable habits, earn rewards, and compete with friends while protecting our planet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={user ? "/dashboard" : "/register"}>
                <Button className="eco-gradient-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 min-w-48">
                  <Rocket className="mr-2" />
                  Get Started
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={scrollToFeatures}
                className="border-2 border-eco-primary text-eco-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-eco-primary hover:text-white transition-all duration-200 min-w-48"
              >
                <Info className="mr-2" />
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Floating eco icons */}
          <div className="absolute top-20 left-20 animate-bounce hidden lg:block" style={{animationDelay: '0s'}}>
            <div className="w-12 h-12 bg-eco-secondary rounded-full flex items-center justify-center shadow-lg">
              <Recycle className="text-white" />
            </div>
          </div>
          <div className="absolute top-40 right-20 animate-bounce hidden lg:block" style={{animationDelay: '1s'}}>
            <div className="w-12 h-12 bg-eco-primary rounded-full flex items-center justify-center shadow-lg">
              <Train className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-40 left-32 animate-bounce hidden lg:block" style={{animationDelay: '2s'}}>
            <div className="w-12 h-12 bg-eco-sky rounded-full flex items-center justify-center shadow-lg">
              <Lightbulb className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-20 right-32 animate-bounce hidden lg:block" style={{animationDelay: '3s'}}>
            <div className="w-12 h-12 bg-eco-earth rounded-full flex items-center justify-center shadow-lg">
              <Droplet className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Why Choose EcoTrack+?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover how our platform makes sustainable living fun, rewarding, and impactful.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <Card className="bg-gradient-to-br from-white to-eco-mint/5 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 eco-gradient-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <TrendingUp className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Track Progress</h3>
                <p className="text-gray-600 leading-relaxed">Monitor your daily eco-friendly activities and see your positive impact grow over time.</p>
              </CardContent>
            </Card>
            
            {/* Feature Card 2 */}
            <Card className="bg-gradient-to-br from-white to-eco-secondary/5 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-eco-secondary to-eco-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Trophy className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Rewards</h3>
                <p className="text-gray-600 leading-relaxed">Collect eco-points and unlock amazing rewards, badges, and certificates for your efforts.</p>
              </CardContent>
            </Card>
            
            {/* Feature Card 3 */}
            <Card className="bg-gradient-to-br from-white to-eco-sky/5 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 eco-gradient-sky rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Users className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Join Community</h3>
                <p className="text-gray-600 leading-relaxed">Connect with like-minded eco-warriors and compete on the global leaderboard.</p>
              </CardContent>
            </Card>
            
            {/* Feature Card 4 */}
            <Card className="bg-gradient-to-br from-white to-eco-earth/5 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-eco-earth to-eco-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Globe className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Save Planet</h3>
                <p className="text-gray-600 leading-relaxed">Make a real difference with every action you track and inspire others to join the movement.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-eco-forest text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 eco-gradient-primary rounded-full flex items-center justify-center">
                  <Leaf className="text-white" />
                </div>
                <span className="text-xl font-bold">EcoTrack+</span>
              </div>
              <p className="text-eco-mint mb-4">Making sustainable living fun, rewarding, and impactful for everyone.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-eco-mint">
                <li><Link href="/dashboard"><a className="hover:text-white transition-colors duration-200">Habit Tracking</a></Link></li>
                <li><Link href="/rewards"><a className="hover:text-white transition-colors duration-200">Eco Rewards</a></Link></li>
                <li><Link href="/leaderboard"><a className="hover:text-white transition-colors duration-200">Leaderboard</a></Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-eco-mint">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-eco-mint mb-4">Get eco-tips and updates delivered to your inbox.</p>
            </div>
          </div>
          <div className="border-t border-eco-primary/30 mt-8 pt-8 text-center text-eco-mint">
            <p>&copy; 2024 EcoTrack+. All rights reserved. Made with 💚 for our planet.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
