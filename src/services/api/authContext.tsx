import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import {
  loginUser,
  loginWithGoogle as loginWithGoogleService,
  logoutUser,
  tryRestoreAuth,
} from "./authService";
import { api, resetAuthExpiredState, subscribeToAuthExpired } from "./apiService";
import { getAccessToken, clearAccessToken } from "./tokenStore";
import { ME_URL } from "./apiUrl";

/**
 * Interface for JWT payload.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  exp: number;
  [key: string]: unknown;
}

/**
 * Interface for user data.
 */
export interface User {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Authentication state.
 */
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

/**
 * Auth context props.
 */
interface AuthContextProps extends AuthState {
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Loggar in med ett Google ID-token (Google Identity Services). */
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Hämtar om användarprofilen, t.ex. efter en profiluppdatering. */
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches user data from the API and updates auth state.
   */
  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();

      // Decode role and sub (userId) from token as fallback
      let decodedRole: string | undefined;
      let decodedSub: string | undefined;

      if (accessToken) {
        try {
          const decoded = jwtDecode<JwtPayload>(accessToken);
          decodedRole =
            (decoded?.role as string | undefined) ||
            (decoded?.[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] as string | undefined);
          decodedSub = decoded?.sub;
        } catch (err) {
          console.warn("Could not decode access token", err);
        }
      }

      // /api/me returnerar hela profilen i ett anrop
      const response = await api.get(ME_URL);

      const data = response.data || {};
      const userId = data.userId || data.id || decodedSub;
      const email = data.email;
      const role = data.role || decodedRole;

      setAuthState({
        isAuthenticated: true,
        user: {
          id: userId,
          email,
          role,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          phoneNumber: data.phoneNumber || undefined,
          avatarUrl: data.avatarUrl || undefined,
        },
      });

      return true;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setAuthState({ isAuthenticated: false, user: null });
      return false;
    }
  }, []);

  /**
   * Initialize auth state on app load.
   * Attempts to restore auth from HttpOnly refresh token cookie.
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthExpired(() => {
      clearAccessToken();
      setAuthState({ isAuthenticated: false, user: null });
      setIsLoading(false);
    });

    const initAuth = async () => {
      try {
        // Try to get a new access token using the refresh token cookie
        const restored = await tryRestoreAuth();

        if (restored) {
          // If we got a token, fetch user data
          await fetchUser();
        } else {
          setAuthState({ isAuthenticated: false, user: null });
        }
      } catch {
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    return unsubscribe;
  }, [fetchUser]);

  /**
   * Login handler.
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      resetAuthExpiredState();
      await loginUser(email, password);
      await fetchUser();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [fetchUser]);

  /**
   * Google-login: samma efterflöde som lösenordslogin.
   */
  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      resetAuthExpiredState();
      await loginWithGoogleService(credential);
      await fetchUser();
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }, [fetchUser]);

  /**
   * Logout handler.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
      // Continue with local cleanup even if server request fails
    } finally {
      clearAccessToken();
      setAuthState({ isAuthenticated: false, user: null });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...authState, isLoading, login, loginWithGoogle, logout, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
