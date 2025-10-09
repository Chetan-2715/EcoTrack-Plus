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

  // Hydrate user from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ecotrack:user");
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
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
      }
    });

    return () => { sub.subscription.unsubscribe(); };
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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}