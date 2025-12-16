import { USER_NAME_URL, GET_EMPLOYEES_URL } from "./apiUrl";
import { api } from "./apiService";
import { UserNameDTO, Employee } from "./types";
import { getCookie } from "./authService";

export const getUserName = async (): Promise<UserNameDTO | null> => {
  try {
    const response = await api.get<UserNameDTO>(USER_NAME_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user name:", error);
    return null;
  }
};

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const token = getCookie("accessToken");
    const res = await api.get<Employee[]>(GET_EMPLOYEES_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data ?? [];
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
};
