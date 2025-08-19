import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../lib/auth";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", show: true },
    { path: "/dashboard", label: "Dashboard", show: !!user },
    { path: "/rewards", label: "Rewards", show: !!user },
    { path: "/leaderboard", label: "Leaderboard", show: true },
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
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 eco-gradient-primary rounded-full flex items-center justify-center">
                <Leaf className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-eco-forest">EcoTrack+</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {navItems
              .filter(item => item.show)
              .map(item => (
                <Link key={item.path} href={item.path}>
                  <a className={`transition-colors duration-200 font-medium ${
                    isActive(item.path) 
                      ? "text-eco-primary font-bold" 
                      : "text-gray-700 hover:text-eco-primary"
                  }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.username}!
                </span>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="eco-gradient-primary text-white hover:shadow-lg">
                  Login
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
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems
              .filter(item => item.show)
              .map(item => (
                <Link key={item.path} href={item.path}>
                  <a 
                    className={`block py-2 transition-colors duration-200 font-medium ${
                      isActive(item.path) 
                        ? "text-eco-primary font-bold" 
                        : "text-gray-700 hover:text-eco-primary"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            
            {user ? (
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Welcome, {user.username}!</p>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100">
                <Link href="/login">
                  <Button 
                    className="w-full eco-gradient-primary text-white hover:shadow-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
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
