import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../lib/auth";
import { Leaf, Menu, X, Home, Gift, User, Sun, Moon, LogOut, Trophy } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home, show: !user },
    { path: "/dashboard", label: "Home", icon: Home, show: !!user },
    { path: "/rewards", label: "Rewards", icon: Gift, show: !!user },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy, show: !!user },
    { path: "/profile", label: "Profile", icon: () => user ? <UserAvatar username={user.username} avatarUrl={(user as any).avatarUrl} size="sm" /> : <User className="w-5 h-5" />, show: !!user },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 eco-gradient-primary rounded-full flex items-center justify-center">
                <Leaf className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-eco-forest dark:text-eco-mint">EcoTrack+</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer ${
                      isActive(item.path) 
                        ? "bg-eco-primary/20 text-eco-primary shadow-sm" 
                        : "text-muted-foreground hover:text-eco-primary hover:bg-eco-primary/10"
                    }`} title={item.label}>
                      <Icon />
                    </div>
                  </Link>
                );
              })}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-eco-primary/10 hover:text-eco-primary transition-all duration-200 hover:scale-110"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* User Menu */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
            
            {!user && (
              <Link href="/register">
                <Button className="eco-gradient-primary text-white hover:shadow-lg transition-all duration-200 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
          
          <button 
            className="md:hidden text-gray-600 hover:text-eco-primary transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="text-xl" /> : <Menu className="text-xl" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div 
                      className={`flex items-center space-x-3 py-3 px-2 rounded-lg transition-all duration-200 ${
                        isActive(item.path) 
                          ? "bg-eco-primary/20 text-eco-primary" 
                          : "text-muted-foreground hover:text-eco-primary hover:bg-eco-primary/10"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            
            {/* Mobile Theme Toggle */}
            <div className="pt-2 border-t border-border space-y-2">
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full justify-start space-x-3 py-3 px-2 rounded-lg hover:bg-eco-primary/10 hover:text-eco-primary transition-all duration-200"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>
              
              {user && (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start space-x-3 py-3 px-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </Button>
              )}
            </div>
            
            {!user && (
              <div className="pt-2 border-t border-border">
                <Link href="/register">
                  <Button 
                    className="w-full eco-gradient-primary text-white hover:shadow-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}