import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../lib/auth";
import { Leaf, Menu, X, Home, Gift, User, Sun, Moon, LogOut, Trophy } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeLinkStyle, setActiveLinkStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (navRef.current) {
      const activeItem = navRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        const { offsetLeft, offsetWidth } = activeItem as HTMLElement;
        setActiveLinkStyle({ left: offsetLeft + offsetWidth / 2 - 20, width: 40 });
      }
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer logo-container group">
              <div className="w-10 h-10 eco-gradient-primary rounded-full flex items-center justify-center">
                <Leaf className="text-white text-lg leaf-icon transition-transform duration-300" />
              </div>
              <span className="text-2xl font-bold text-eco-forest dark:text-eco-mint ecotrack-text">EcoTrack+</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6 relative" ref={navRef}>
            <div className={`absolute rounded-full h-10 w-10 top-1/2 -translate-y-1/2 transition-all duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-black'} mix-blend-difference`}
              style={{ left: activeLinkStyle.left, width: activeLinkStyle.width }}></div>
            {navItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div data-active={isActive(item.path)} className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer nav-icon-container z-10 ${
                      isActive(item.path) 
                        ? "text-white" 
                        : "text-muted-foreground"
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
              <div className="relative w-5 h-5">
                <Sun className={`absolute transition-all duration-500 ${isDarkMode ? 'transform rotate-90 opacity-0' : 'transform rotate-0 opacity-100'}`} />
                <Moon className={`absolute transition-all duration-500 ${isDarkMode ? 'transform rotate-0 opacity-100' : 'transform -rotate-90 opacity-0'}`} />
              </div>
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
                <Button className="bg-eco-primary text-white hover:shadow-lg transition-all duration-200 hover:scale-105 fill-on-hover" style={{'--hover-fill-color': 'black'} as React.CSSProperties}>
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
                      className={`flex items-center space-x-3 py-3 px-2 rounded-lg transition-all duration-200 nav-icon-container ${
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
                <div className="relative w-5 h-5">
                  <Sun className={`absolute transition-all duration-500 ${isDarkMode ? 'transform rotate-90 opacity-0' : 'transform rotate-0 opacity-100'}`} />
                  <Moon className={`absolute transition-all duration-500 ${isDarkMode ? 'transform rotate-0 opacity-100' : 'transform -rotate-90 opacity-0'}`} />
                </div>
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
                    className="w-full bg-eco-primary text-white hover:shadow-lg transition-all duration-200 fill-on-hover"
                    style={{ ['--hover-fill-color' as string]: 'black' }}
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