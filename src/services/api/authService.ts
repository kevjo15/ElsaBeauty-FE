import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  REVOKE_REFRESH_TOKEN_URL,
  LOGIN_URL,
  REFRESH_TOKEN_URL,
} from "./apiUrl";
import { api, setCookie } from "./apiService";

// Interface för JWT-payload
interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  RefreshTokenExpiryTime: string;
  exp: number; // Lägg till detta, exp anges i sekunder
  [key: string]: unknown;
}

/**
 * Dekodar ett JWT och returnerar dess payload.
 */
export const decodeAccessToken = (token: string): JwtPayload => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    throw new Error("Failed to decode access token");
  }
};

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

/**
 * Hjälpfunktion för att ta bort en cookie.
 */
function deleteCookie(name: string) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Loggar in användaren genom att anropa backend.
 * Backend returnerar ett token (i JSON) och sätter även cookien via withCredentials.
 * Vi avkodar tokenet för att spara metadata (RefreshTokenExpiryTime) i localStorage
 * och sätter accessToken i en cookie. Därefter schemaläggs en proaktiv refresh.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const response = await api.post(
      LOGIN_URL, // t.ex. `${API_BASE_URL}/User/login`
      { email, password },
      { withCredentials: true }
    );
    const token = response.data.token;
    if (token) {
      const decoded = decodeAccessToken(token);
      localStorage.setItem(
        "refreshTokenExpiryTime",
        decoded.RefreshTokenExpiryTime
      );
      setCookie("accessToken", token, 1); // Sätter cookien i 1 dag (justera efter behov)
      // Schemalägg proaktiv refresh direkt efter inloggning
      scheduleTokenRefresh();
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      throw new Error(errorMessage || "Failed to log in. Please try again.");
    }
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Loggar ut användaren genom att anropa backend för att återkalla refreshToken,
 * samt tar bort accessToken-cookien och rensar metadata från localStorage.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // 1. Hämta JWT från t.ex. din cookie eller var du lagrar accessToken:
    const token = getCookie("accessToken");

    // 2. Skicka med en Authorization-header
    await api.post(
      REVOKE_REFRESH_TOKEN_URL,
      {}, // Skicka eventuellt en tom body
      {
        headers: {
          Authorization: `Bearer ${token}`, // Viktigt!
          "Content-Type": "application/json", // Eller 'text/plain'
        },
      }
    );

    // 3. Rensa lokala saker
    deleteCookie("accessToken");
    localStorage.removeItem("refreshTokenExpiryTime");

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    console.log("Logout success");
  } catch (error) {
    console.error("Logout failed:", error);
    throw new Error("Failed to log out. Please try again.");
  }
};

/**
 * Schemalägger en proaktiv token refresh 2 minuter innan accessToken går ut.
 * Använder "exp"-claimen från JWT:et.
 */
export function scheduleTokenRefresh() {
  const token = getCookie("accessToken");
  if (!token) {
    console.warn("Ingen accessToken hittades, kan inte schemalägga refresh.");
    return;
  }

  // Använd jwtDecode för att avkoda tokenet (vi använder any här för att få åtkomst till "exp")
  const decoded = jwtDecode<JwtPayload>(token);
  if (!decoded.exp) {
    console.warn("Tokenet saknar 'exp'-claim, kan inte schemalägga refresh.");
    return;
  }

  // "exp" är i sekunder, omvandla till millisekunder:
  const expTimeMs = decoded.exp * 1000;
  const nowMs = Date.now();
  const buffer = 2 * 60 * 1000; // 2 minuter i millisekunder
  const timeout = expTimeMs - nowMs - buffer;

  // Rensa ev. tidigare timeout
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }

  if (timeout <= 0) {
    // Om tokenet är nära utgång, kalla refresh direkt
    refreshTokenProactively();
  } else {
    console.log(
      `Schemalägger token refresh om ${Math.floor(timeout / 1000)} sekunder.`
    );
    refreshTimeoutId = setTimeout(refreshTokenProactively, timeout);
  }
}

/**
 * Funktionen som anropar refresh-endpointen för att förnya accessToken.
 * Denna funktion används av scheduleTokenRefresh.
 */
async function refreshTokenProactively() {
  try {
    // Hämta det aktuella accessToken från cookien
    const currentToken = getCookie("accessToken");
    if (!currentToken) {
      throw new Error("No accessToken available for refresh.");
    }
    // Skicka med det aktuella tokenet i request body
    const response = await api.post<{ accessToken: string }>(
      REFRESH_TOKEN_URL,
      { AccessToken: currentToken }
    );
    const newToken = response.data.accessToken;
    // Kontrollera att vi fick ett giltigt token
    if (!newToken || typeof newToken !== "string") {
      throw new Error("Invalid token received from refresh endpoint.");
    }
    // Avkoda det nya tokenet med din typ
    const decoded = jwtDecode<JwtPayload>(newToken);
    localStorage.setItem(
      "refreshTokenExpiryTime",
      decoded.RefreshTokenExpiryTime
    );
    // Uppdatera accessToken-cookien med det nya tokenet
    setCookie("accessToken", newToken, 1);
    console.log("Token förnyades proaktivt. nya accessToken :", newToken);
    // Schemalägg nästa refresh baserat på det nya tokenets exp-claim
    scheduleTokenRefresh();
  } catch (err) {
    console.error("Proaktiv token refresh misslyckades:", err);
    // Vid fel kan du hantera utloggning eller annan återhämtning här
  }
}
