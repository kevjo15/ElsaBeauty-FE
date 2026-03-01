import { USER_NAME_URL, GET_EMPLOYEES_URL } from "./apiUrl";
import { api } from "./apiService";
import { UserNameDTO, Employee } from "./types";

export async function getUserName(): Promise<UserNameDTO | null> {
  try {
    const response = await api.get<UserNameDTO>(USER_NAME_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user name:", error);
    return null;
  }
}

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
