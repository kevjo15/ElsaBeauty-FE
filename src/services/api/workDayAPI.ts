import { api } from "./apiService";
import { generateWorkDaysUrl, getWorkDaysUrl } from "./apiUrl";
import type { GenerateWorkDaysRequest, SetWorkDaysRequest, WorkDay } from "./types";

export const getWorkDays = async (employeeId: string, from: string, to: string): Promise<WorkDay[]> => {
  const { data } = await api.get<WorkDay[]>(getWorkDaysUrl(employeeId), {
    params: { from, to },
  });
  return data;
};

export const setWorkDays = async (employeeId: string, request: SetWorkDaysRequest): Promise<boolean> => {
  try {
    await api.put(getWorkDaysUrl(employeeId), request);
    return true;
  } catch {
    return false;
  }
};

export const generateWorkDays = async (employeeId: string, request: GenerateWorkDaysRequest): Promise<boolean> => {
  try {
    await api.post(generateWorkDaysUrl(employeeId), request);
    return true;
  } catch {
    return false;
  }
};
