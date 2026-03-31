import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!email || !password) throw new Error("Enter email and password");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }
      
      // login() sets user state → AuthPage/HomeOrDashboard will auto-redirect to /dashboard
      login(data.user);
      toast({ title: "Login successful!", description: "Welcome back to EcoTrack+" });
      
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md shadow-2xl border border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 eco-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back!</CardTitle>
          <p className="text-muted-foreground mt-2">Sign in to continue your eco-journey.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="relative floating-label-group">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200 floating-label-input"
                required
              />
              <Label htmlFor="email" className="absolute left-4 top-2 text-gray-500 transition-all duration-200 floating-label">
                Email
              </Label>
            </div>
            <div className="relative floating-label-group">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200 floating-label-input"
                required
              />
              <Label htmlFor="password" className="absolute left-4 top-2 text-gray-500 transition-all duration-200 floating-label">
                Password
              </Label>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full eco-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center w-full">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-eco-primary font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
  );
}
