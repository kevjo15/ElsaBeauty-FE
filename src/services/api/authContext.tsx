import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { loginUser, logoutUser, tryRestoreAuth } from "./authService";
import { api } from "./apiService";
import { getAccessToken, clearAccessToken } from "./tokenStore";
import { ME_URL, USER_NAME_URL } from "./apiUrl";

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
  logout: () => Promise<void>;
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

      // Fetch user info from /me endpoint
      const response = await api.get(ME_URL);

      const data = response.data || {};
      const userId =
        data.userId || data.UserId || data.id || data.Id || decodedSub;
      const email = data.email || data.Email;
      const role = data.role || data.Role || decodedRole;

      // Try to fetch user's name
      let firstName: string | undefined;
      let lastName: string | undefined;

      try {
        const nameResponse = await api.get(USER_NAME_URL);
        if (nameResponse.data) {
          firstName = nameResponse.data.firstName;
          lastName = nameResponse.data.lastName;
        }
      } catch {
        // Name endpoint is optional, ignore errors
      }

      setAuthState({
        isAuthenticated: true,
        user: {
          id: userId,
          email,
          role,
          firstName,
          lastName,
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
  }, [fetchUser]);

  /**
   * Login handler.
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      await loginUser(email, password);
      await fetchUser();
    } catch (error) {
      console.error("Login failed:", error);
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
      value={{ ...authState, isLoading, login, logout }}
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
