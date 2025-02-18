// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getCookie, loginUser, logoutUser } from "./authService";

// Gränssnitt för JWT:s payload (använd samma fält som backend skickar)
export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  exp: number; // utgångstid i sekunder
}

// Interface för användardata
export interface User {
  id: string;
  email: string;
  role?: string;
}

// Autentiseringsstate
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

// Kontextens värde
interface AuthContextProps extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}

// Skapa contexten
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });

  // Vid uppstart, försök läsa token från cookien och avkoda den
  useEffect(() => {
    const token = getCookie("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            token,
            user: { id: decoded.sub, email: decoded.email, role: decoded.role },
          });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setAuthState({ isAuthenticated: false, token: null, user: null });
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
    const token = getCookie("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setAuthState({
          isAuthenticated: true,
          token,
          user: { id: decoded.sub, email: decoded.email, role: decoded.role },
        });
      } catch (error) {
        console.error("Error decoding token after login:", error);
      }
    }
  };

  const logout = async () => {
    await logoutUser();
    setAuthState({ isAuthenticated: false, token: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
