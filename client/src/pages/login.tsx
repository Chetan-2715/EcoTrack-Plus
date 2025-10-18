import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
// Email/password via Supabase + OAuth for Google/Microsoft
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!email || !password) throw new Error("Enter email and password");
      
      // Use direct backend login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }
      
      // Login successful - update auth context and redirect
      login(data.user);
      toast({ title: "Login successful!", description: "Welcome back to EcoTrack+" });
      setLocation("/dashboard");
      
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "azure"): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === "azure" ? "azure" : "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "OAuth sign-in failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border border-border">
        <CardContent className="flex flex-col justify-center items-center py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground">Sign in to continue your eco-journey.</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full eco-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Button type="button" variant="outline" className="w-full py-3 rounded-xl" onClick={() => signInWithProvider("google")}>
                Continue with Google
              </Button>
              <Button type="button" variant="outline" className="w-full py-3 rounded-xl" onClick={() => signInWithProvider("azure")}>
                Continue with Microsoft
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center w-full">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <a className="text-eco-primary font-semibold hover:underline">Sign up</a>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
