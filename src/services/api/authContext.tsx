import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  loginUser,
  logoutUser,
  scheduleTokenRefresh,
  getCookie,
} from "./authService";
import { ME_URL, USER_NAME_URL } from "./apiUrl";

// Gränssnitt för JWT:s payload (behålls för referens)
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
  firstName?: string;
  lastName?: string;
}

// Autentiseringsstate. Notera att vi fortfarande har fältet token, men med httpOnly-cookies kan vi inte läsa ut token från klienten.
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

// Kontextens värde
interface AuthContextProps extends AuthState {
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Funktion som anropar "me"-endpointen för att hämta aktuell användardata
  const fetchUser = async () => {
    try {
      const accessToken = getCookie("accessToken");

      // Decode role from token as fallback if ME omits it
      let decodedRole: string | undefined;
      if (accessToken) {
        try {
          const decoded = jwtDecode<JwtPayload & Record<string, unknown>>(accessToken);
          decodedRole =
            (decoded?.role as string | undefined) ||
            (decoded?.Role as string | undefined) ||
            (decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string | undefined);
        } catch (err) {
          console.warn("Could not decode access token", err);
        }
      }

      const response = await axios.get(ME_URL, {
        withCredentials: true,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });
      const { userId, email, role } = response.data;

      // Hämta användarens för- och efternamn
      let firstName = undefined;
      let lastName = undefined;

      try {
        console.log("Fetching user name from:", USER_NAME_URL);
        console.log("Access token:", getCookie("accessToken"));

        const nameResponse = await axios.get(USER_NAME_URL, {
          withCredentials: true,
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
        });

        console.log("Name response data:", nameResponse.data);

        if (nameResponse.data) {
          firstName = nameResponse.data.firstName;
          lastName = nameResponse.data.lastName;
          console.log("Extracted name:", firstName, lastName);
        }
      } catch (nameError) {
        console.error("Failed to fetch user name:", nameError);
      }

      setAuthState({
        isAuthenticated: true,
        token: null, // httpOnly-cookie, så vi kan inte läsa token från klienten
        user: {
          id: userId,
          email,
          role: role ?? decodedRole,
          firstName,
          lastName,
        },
      });
    } catch (error) {
      console.error("Fel vid hämtning av användardata:", error);
      setAuthState({ isAuthenticated: false, token: null, user: null });
    } finally {
      setIsLoading(false);
    }
  };

  // Vid sidladdning anropas fetchUser för att återskapa authState
  useEffect(() => {
    (async () => {
      await fetchUser();
      // Om användaren är inloggad finns en cookie, då schemalägger vi token refresh
      scheduleTokenRefresh();
    })();
  }, []);

  // Vid inloggning: anropa loginUser och därefter fetchUser för att hämta användardata
  const login = async (email: string, password: string) => {
    try {
      await loginUser(email, password);
      await fetchUser();
    } catch (error) {
      console.error("Inloggning misslyckades:", error);
      throw error;
    }
  };

  // Vid utloggning: anropa logoutUser och återställ authState
  const logout = async () => {
    try {
      await logoutUser();
      setAuthState({ isAuthenticated: false, token: null, user: null });
    } catch (error) {
      console.error("Utloggning misslyckades:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ ...authState, isLoading, login, logout, setAuthState }}
    >
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
