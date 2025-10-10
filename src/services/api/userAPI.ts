import { USER_NAME_URL } from "./apiUrl";
import { api } from "./apiService";
import { UserNameDTO } from "./types";

export const getUserName = async (): Promise<UserNameDTO | null> => {
  try {
    const response = await api.get<UserNameDTO>(USER_NAME_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user name:", error);
    return null;
  }
};
