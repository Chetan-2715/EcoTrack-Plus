import { useLocation } from "wouter";
import Login from "./login";
import Register from "./register";
import { AuthTabs } from "../components/auth-tabs";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const activeTab = location === "/login" ? "login" : "register";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AuthTabs activeTab={activeTab} onTabChange={(tab) => setLocation(`/${tab}`)} />
        <div className={`flip-card ${activeTab === 'login' ? 'flipped' : ''}`}>
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <Register />
            </div>
            <div className="flip-card-back">
              <Login />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
