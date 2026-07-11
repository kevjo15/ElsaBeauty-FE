import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  LOGIN_URL,
  GOOGLE_LOGIN_URL,
  REGISTER_URL,
  REVOKE_REFRESH_TOKEN_URL,
  FORGOT_PASSWORD_URL,
  RESET_PASSWORD_URL,
  CONFIRM_EMAIL_URL,
  RESEND_CONFIRMATION_URL,
} from "./apiUrl";
import { api, refreshAccessToken } from "./apiService";
import { setAccessToken, clearAccessToken, getAccessToken } from "./tokenStore";

/**
 * Interface for JWT payload.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  exp: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT and returns its payload.
 */
export function decodeAccessToken(token: string): JwtPayload {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    throw new Error("Failed to decode access token");
  }
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

/**
 * Registers a new user.
 */
export async function registerUser(data: RegisterData): Promise<void> {
  try {
    await axios.post(REGISTER_URL, data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      if (Array.isArray(responseData)) {
        throw new Error(responseData.join(" "));
      }
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        throw new Error(responseData.errors.join(" "));
      }
      throw new Error(
        typeof responseData === "string"
          ? responseData
          : "Registration failed. Please try again."
      );
    }
    throw new Error("An unexpected error occurred");
  }
}

/**
 * Begär en återställningslänk. Servern svarar alltid 200
 * (avslöjar inte om adressen finns).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await axios.post(FORGOT_PASSWORD_URL, { email });
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Sätter nytt lösenord med token från återställningsmejlet.
 */
export async function resetPassword(data: ResetPasswordData): Promise<void> {
  try {
    await axios.post(RESET_PASSWORD_URL, data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      if (typeof responseData === "string" && responseData) {
        throw new Error(responseData);
      }
      if (responseData?.title) {
        throw new Error(responseData.title);
      }
    }
    throw new Error("Kunde inte återställa lösenordet. Försök igen.");
  }
}

/**
 * Bekräftar e-postadressen med token från bekräftelsemejlet.
 */
export async function confirmEmail(userId: string, token: string): Promise<void> {
  try {
    await axios.post(CONFIRM_EMAIL_URL, { userId, token });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      if (typeof responseData === "string" && responseData) {
        throw new Error(responseData);
      }
      if (responseData?.title) {
        throw new Error(responseData.title);
      }
    }
    throw new Error("Kunde inte bekräfta e-postadressen. Försök igen.");
  }
}

/**
 * Begär ett nytt bekräftelsemejl. Servern svarar alltid 200.
 */
export async function resendConfirmation(email: string): Promise<void> {
  await axios.post(RESEND_CONFIRMATION_URL, { email });
}

/**
 * Logs in the user.
 *
 * Backend returns accessToken in response body and sets refreshToken in HttpOnly cookie.
 * We store the accessToken in memory (not localStorage or cookies).
 */
export async function loginUser(email: string, password: string): Promise<void> {
  try {
    const response = await axios.post(
      LOGIN_URL,
      { email, password },
      { withCredentials: true } // Required to receive HttpOnly cookie
    );

    const token = response.data.accessToken;
    if (!token) {
      throw new Error("No access token received from server");
    }

    // Store access token in memory
    setAccessToken(token);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      throw new Error(typeof errorMessage === 'string' ? errorMessage : "Failed to log in. Please try again.");
    }
    throw new Error("An unexpected error occurred");
  }
}

/**
 * Loggar in med ett Google ID-token (från Google Identity Services).
 * Backend verifierar tokenet och svarar precis som vanlig login:
 * accessToken i body + refresh-token som HttpOnly-cookie.
 */
export async function loginWithGoogle(credential: string): Promise<void> {
  try {
    const response = await axios.post(
      GOOGLE_LOGIN_URL,
      { idToken: credential },
      { withCredentials: true } // Krävs för att ta emot HttpOnly-cookien
    );

    const token = response.data.accessToken;
    if (!token) {
      throw new Error("No access token received from server");
    }

    setAccessToken(token);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      throw new Error(
        typeof errorMessage === "string"
          ? errorMessage
          : "Google-inloggningen misslyckades. Försök igen."
      );
    }
    throw new Error("An unexpected error occurred");
  }
}

/**
 * Logs out the user.
 *
 * Calls backend to revoke the refresh token (clears HttpOnly cookie).
 * Clears the access token from memory.
 */
export async function logoutUser(): Promise<void> {
  try {
    const token = getAccessToken();

    // Call backend to revoke refresh token and clear cookie
    await api.post(
      REVOKE_REFRESH_TOKEN_URL,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  } catch (error) {
    console.error("Logout request failed:", error);
    // Continue with local cleanup even if server request fails
  } finally {
    // Always clear the access token from memory
    clearAccessToken();
  }
}

/**
 * Attempts to restore authentication state on app initialization.
 *
 * Uses the HttpOnly refresh token cookie to get a new access token.
 * Returns true if successfully authenticated, false otherwise.
 */
export async function tryRestoreAuth(): Promise<boolean> {
  try {
    const token = await refreshAccessToken();
    return token !== null;
  } catch {
    return false;
  }
}

/**
 * Gets the current access token from memory.
 * Re-exported for convenience.
 */
export { getAccessToken } from "./tokenStore";
