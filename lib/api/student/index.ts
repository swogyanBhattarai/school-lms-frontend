import api from "@/lib/api";
import type {
  PageResponse,
  StudentCreate,
  StudentDetailResponse,
  StudentModel,
  StudentResponse,
  StudentUpdate,
} from "@/types/lms";

export type StudentQueryParams = {
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  pageSize?: number;
  pageNum?: number;
  studentName?: string;
  sectionId?: number;
  classId?: number;
  hasSectionAssignment?: boolean;
};

/**
 * Fetch paginated students
 */
export const getStudents = async (
  params?: StudentQueryParams
): Promise<PageResponse<StudentResponse>> => {
  const response = await api.get<PageResponse<StudentResponse>>("/api/student", {
    params,
  });
  return response.data;
};

/**
 * Fetch a single student by ID
 */
export const getStudentById = async (
  id: number
): Promise<StudentDetailResponse> => {
  const response = await api.get<StudentDetailResponse>(`/api/student/${id}`);
  return response.data;
};

/**
 * Create a new student
 */
export const createStudent = async (
  payload: StudentCreate
): Promise<StudentModel> => {
  const response = await api.post<StudentModel>("/api/student", payload);
  return response.data;
};

/**
 * Update a student
 */
export const updateStudent = async (
  id: number,
  payload: StudentUpdate
): Promise<StudentModel> => {
  const response = await api.put<StudentModel>(`/api/student/${id}`, payload);
  return response.data;
};

/**
 * Delete a student
 */
export const deleteStudent = async (id: number): Promise<void> => {
  await api.delete(`/api/student/${id}`);
};
