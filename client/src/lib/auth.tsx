import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "./supabase";

interface User {
  id: string;
  username: string;
  email: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user from localStorage once on mount
  useEffect(() => {
    let subscription: any = null;

    const initAuth = async () => {
      try {
        const stored = localStorage.getItem("ecotrack:user");
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          
          // Fetch fresh user data from API to ensure we have latest info
          try {
            const response = await fetch(`/api/users/${parsed.id}`);
            if (response.ok) {
              const data = await response.json();
              if (data.user) {
                setUser(data.user);
                localStorage.setItem("ecotrack:user", JSON.stringify(data.user));
              }
            } else {
              // If API returns error (user deleted, etc), clear storage
              localStorage.removeItem("ecotrack:user");
              setUser(null);
            }
          } catch (apiError) {
            console.error("Failed to fetch user data:", apiError);
            // Keep the cached user if API fails
          }
        }
      } catch {
        // ignore storage errors
      }

      // Hydrate from Supabase session if available
      supabase.auth.getSession().then(({ data }) => {
        const ssoUser = data.session?.user;
        if (ssoUser) {
          const email = ssoUser.email || "";
          const username = ssoUser.user_metadata?.full_name || ssoUser.user_metadata?.name || (email?.split("@")[0] ?? "User");
          const u = { id: ssoUser.id, username, email, points: 0 } as User;
          setUser(u);
          try { localStorage.setItem("ecotrack:user", JSON.stringify(u)); } catch {}
        }
      });

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const ssoUser = session?.user;
        if (ssoUser) {
          const email = ssoUser.email || "";
          const username = ssoUser.user_metadata?.full_name || ssoUser.user_metadata?.name || (email?.split("@")[0] ?? "User");
          const u = { id: ssoUser.id, username, email, points: 0 } as User;
          setUser(u);
          try { localStorage.setItem("ecotrack:user", JSON.stringify(u)); } catch {}
        } else {
          // User signed out from Supabase
          setUser(null);
          localStorage.removeItem("ecotrack:user");
        }
      });

      subscription = sub.subscription;
      setLoading(false);
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem("ecotrack:user", JSON.stringify(userData));
    } catch {
      // ignore storage errors
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("ecotrack:user");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}