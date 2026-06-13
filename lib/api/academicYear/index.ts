import api from "../../api";
import type {
  AcademicYearResponse,
  AcademicYearModel,
  AcademicYearCreate,
} from "@/types/lms";

// Get all academic years
export const getAcademicYears = async (): Promise<AcademicYearResponse[]> => {
  const res = await api.get<AcademicYearResponse[]>("/api/academic-year");
  return res.data;
};

// Get academic year by ID
export const getAcademicYearById = async (
  id: number
): Promise<AcademicYearModel> => {
  const res = await api.get<AcademicYearModel>(`/api/academic-year/${id}`);
  return res.data;
};

// Create academic year
export const createAcademicYear = async (
  payload: AcademicYearCreate
): Promise<string> => {
  const res = await api.post<string>("/api/academic-year", payload);
  return res.data;
};

// Update academic year
export const updateAcademicYear = async (
  id: number,
  payload: AcademicYearCreate
): Promise<string> => {
  const res = await api.put<string>(`/api/academic-year/${id}`, payload);
  return res.data;
};

export const setActiveAcademicYear = async (id: number): Promise<string> => {
  const res = await api.put<string>(`/api/academic-year/set-active/${id}`);
  return res.data;
}

// Delete academic year
export const deleteAcademicYear = async (id: number): Promise<void> => {
  await api.delete(`/api/academic-year/${id}`);
};
