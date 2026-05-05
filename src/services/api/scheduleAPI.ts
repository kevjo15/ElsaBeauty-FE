import { api } from "./apiService";
import { getScheduleUrl } from "./apiUrl";
import type { EmployeeSchedule } from "./types";

export async function getEmployeeSchedule(employeeId: string): Promise<EmployeeSchedule[]> {
  try {
    const response = await api.get<EmployeeSchedule[]>(getScheduleUrl(employeeId));
    return response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch employee schedule:", error);
    return [];
  }
}

export async function setEmployeeSchedule(
  employeeId: string,
  schedule: EmployeeSchedule[]
): Promise<boolean> {
  try {
    await api.put(getScheduleUrl(employeeId), schedule);
    return true;
  } catch (error) {
    console.error("Failed to set employee schedule:", error);
    return false;
  }
}
