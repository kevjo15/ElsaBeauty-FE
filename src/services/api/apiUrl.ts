export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Specific endpoints
export const REGISTER_URL = `${API_BASE_URL}/register`;
export const LOGIN_URL = `${API_BASE_URL}/User/login`;
export const REVOKE_REFRESH_TOKEN_URL = `${API_BASE_URL}/User/revokeRefreshToken`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/User/refreshAccessToken`;

export const ME_URL = `${API_BASE_URL}/User/me`;
