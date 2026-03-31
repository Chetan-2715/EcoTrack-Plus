import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from "react";

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
  const justLoggedIn = useRef(false);

  useEffect(() => {
    const initAuth = () => {
      try {
        const stored = localStorage.getItem("ecotrack:user");
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
        }
      } catch {
        // ignore storage errors
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback((userData: User) => {
    justLoggedIn.current = true;
    setUser(userData);
    setLoading(false);
    try {
      localStorage.setItem("ecotrack:user", JSON.stringify(userData));
    } catch {
      // ignore storage errors
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("ecotrack:user");
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}