import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  ratings?: Array<{
    id: number;
    ratingAfter: number;
    ratingChange: number;
    createdAt: string;
  }>;
  gameMembers?: Array<{
    id: number;
    score: number;
    isWinner: boolean;
    rank?: number | null;
    game?: {
      id: number;
      timeLimit: number;
      createdAt: string;
    };
  }>;
};

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  registerSuccess: (token: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:8000/api/v1/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("matik_token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.user) {
          setUser(json.data.user);
          return;
        }
      }
      // If unauthorized, clean up
      if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchProfile(token);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem("matik_token", newToken);
    setToken(newToken);
    await fetchProfile(newToken);
  };

  const registerSuccess = async (newToken: string) => {
    await login(newToken);
  };

  const logout = () => {
    localStorage.removeItem("matik_token");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        registerSuccess,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
