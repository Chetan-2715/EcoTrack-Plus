import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Button as UIButton } from "@/components/ui/button";

export default function Register() {
  const [username, setUsername] = useState("");
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
      // Use direct backend registration without email verification
      const response = await apiRequest("POST", "/api/auth/register", {
        username,
        email,
        password,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      // User registered successfully - auto login
      login(data.user);
      toast({ 
        title: "Registration successful!", 
        description: "Welcome to EcoTrack+! You're now logged in." 
      });
      setLocation("/dashboard");
      
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "azure") => {
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
        <CardHeader className="text-center">
          <div className="w-16 h-16 eco-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Join EcoTrack+</CardTitle>
          <p className="text-muted-foreground mt-2">Start your sustainable journey today</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200"
                required
              />
            </div>
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
                placeholder="Create a password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-primary focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full eco-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <UIButton type="button" variant="outline" onClick={() => signInWithProvider("google")}>
              Continue with Google
            </UIButton>
            <UIButton type="button" variant="outline" onClick={() => signInWithProvider("azure")}>
              Continue with Microsoft
            </UIButton>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <a className="text-eco-primary font-semibold hover:underline">Sign in</a>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
