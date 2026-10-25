import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import { getMe } from "../services/authService";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("servixo_token"));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("servixo_user");
    return stored ? (JSON.parse(stored) as User) : null;
  });

  function login(newUser: User, newToken: string) {
    localStorage.setItem("servixo_token", newToken);
    localStorage.setItem("servixo_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function updateUser(updatedFields: Partial<User>) {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("servixo_user", JSON.stringify(updated));
      return updated;
    });
  }

  async function refreshUser(): Promise<User | null> {
    try {
      const res = await getMe();
      if (res?.user) {
        const rawUser = res.user as any;
        const formattedUser: User = {
          ...rawUser,
          id: rawUser.id || rawUser._id,
        };
        setUser(formattedUser);
        localStorage.setItem("servixo_user", JSON.stringify(formattedUser));
        return formattedUser;
      }
      return null;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      return null;
    }
  }

  function logout() {
    localStorage.removeItem("servixo_token");
    localStorage.removeItem("servixo_user");
    setToken(null);
    setUser(null);
    navigate("/", { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        updateUser,
        refreshUser,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
