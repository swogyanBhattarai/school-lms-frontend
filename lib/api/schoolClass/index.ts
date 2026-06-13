import api from "../../api";
import type {
  SchoolClassCreate,
  SchoolClassResponse,
  SchoolClassUpdate,
} from "@/types/lms";

// Get all school classes
export const getSchoolClasses = async (): Promise<SchoolClassResponse[]> => {
const res = await api.get<SchoolClassResponse[]>("/api/school-class");
return res.data;
};

// Get all school classes which belong to active academic year`
export const getActiveSchoolClasses = async (): Promise<SchoolClassResponse[]> => {
const res = await api.get<SchoolClassResponse[]>("/api/school-class/get-all-active");
return res.data;
};

// Get school class by ID
export const getSchoolClassById = async (id: number): Promise<SchoolClassResponse> => {
  const res = await api.get<SchoolClassResponse>(`/api/school-class/${id}`);
  return res.data;
};

// Create school class
export const createSchoolClass = async (payload: SchoolClassCreate): Promise<string> => {
  const res = await api.post<string>("/api/school-class", payload);
  return res.data;
};

// Update school class
export const updateSchoolClass = async (id: number, payload: SchoolClassUpdate): Promise<string> => {
  const res = await api.put<string>(`/api/school-class/${id}`, payload);
  return res.data;
};

// Delete school class
export const deleteSchoolClass = async (id: number): Promise<void> => {
  await api.delete(`/api/school-class/${id}`);
};
