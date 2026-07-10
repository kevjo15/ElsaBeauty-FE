import {
  GET_EMPLOYEES_URL,
  UPDATE_PROFILE_URL,
  UPDATE_PASSWORD_URL,
  AVATAR_URL,
  ME_URL,
} from "./apiUrl";
import { api } from "./apiService";
import { Employee, UpdateProfileRequest, UpdatePasswordRequest } from "./types";

export async function getEmployees(): Promise<Employee[]> {
  try {
    // api instance already has auth interceptor that adds Authorization header
    const res = await api.get<Employee[]>(GET_EMPLOYEES_URL);
    return res.data ?? [];
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
}

export async function updateMyProfile(
  profile: UpdateProfileRequest
): Promise<void> {
  await api.put(UPDATE_PROFILE_URL, profile);
}

export async function updateMyPassword(
  passwords: UpdatePasswordRequest
): Promise<void> {
  await api.put(UPDATE_PASSWORD_URL, passwords);
}

/** Laddar upp ny profilbild. Returnerar den signerade bild-URL:en. */
export async function uploadMyAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ avatarUrl: string }>(AVATAR_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.avatarUrl;
}

export async function deleteMyAvatar(): Promise<void> {
  await api.delete(AVATAR_URL);
}

/**
 * Raderar (anonymiserar) det egna kontot enligt GDPR. Efter detta bör
 * anroparen logga ut och navigera till en publik sida.
 */
export async function deleteMyAccount(): Promise<void> {
  await api.delete(ME_URL);
}
