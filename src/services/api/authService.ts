import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { LOGIN_URL, REGISTER_URL, REVOKE_REFRESH_TOKEN_URL } from "./apiUrl";
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
