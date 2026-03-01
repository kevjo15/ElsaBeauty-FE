/**
 * In-memory token store for secure access token management.
 *
 * SECURITY NOTES:
 * - Access tokens are stored ONLY in memory (JavaScript variable)
 * - Tokens are lost on page refresh (by design - more secure)
 * - On page refresh, the app will automatically get a new access token
 *   using the HttpOnly refresh token cookie
 * - This approach prevents XSS attacks from stealing access tokens
 */

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Sets the access token in memory.
 * @param token The JWT access token
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;

  if (token) {
    // Decode token to get expiry time
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenExpiresAt = payload.exp ? payload.exp * 1000 : null;
    } catch {
      tokenExpiresAt = null;
    }
  } else {
    tokenExpiresAt = null;
  }
}

/**
 * Gets the access token from memory.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clears the access token from memory.
 */
export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiresAt = null;
}

/**
 * Checks if the access token is expired or about to expire.
 * Returns true if token should be refreshed.
 * @param bufferMs Buffer time before expiry (default 60 seconds)
 */
export function isTokenExpired(bufferMs: number = 60000): boolean {
  if (!accessToken || !tokenExpiresAt) {
    return true;
  }

  return Date.now() >= (tokenExpiresAt - bufferMs);
}

/**
 * Checks if there is a valid access token in memory.
 */
export function hasValidToken(): boolean {
  return accessToken !== null && !isTokenExpired();
}
