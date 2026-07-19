import api from "@/lib/api";
import type {
  ClassAssignmentAttendanceResponse,
  TeacherResponse,
  TeacherCreate,
  TeacherUpdate,
  TeacherModel,
  TeacherInfo,
} from "@/types/lms";

/**
 * Fetch all teachers
 */
export const getAllTeachers = async (): Promise<TeacherResponse[]> => {
  const response = await api.get<TeacherResponse[]>("/api/teacher");
  return response.data;
};

/**
 * Fetch a single teacher by ID
 */
export const getTeacherById = async (id: number): Promise<TeacherModel> => {
  const response = await api.get<TeacherModel>(`/api/teacher/${id}`);
  return response.data;
};

/**
 * Create a new teacher
 */
export const createTeacher = async (payload: TeacherCreate): Promise<string> => {
  const response = await api.post<string>("/api/teacher", payload);
  return response.data;
};

/**
 * Update a teacher
 */
export const updateTeacher = async (id: number, payload: TeacherUpdate): Promise<string> => {
  const response = await api.put<string>(`/api/teacher/${id}`, payload);
  return response.data;
};

/**
 * Delete a teacher
 */
export const deleteTeacher = async (id: number): Promise<void> => {
  await api.delete(`/api/teacher/${id}`);
};

/**
 * Fetch teacher info by ID (name and phone)
 */
export const getTeacherInfoById = async (id: number): Promise<TeacherInfo> => {
  const response = await api.get<TeacherInfo>(`/api/teacher/info/${id}`);
  return response.data;
};

/**
 * Fetch class assignments for the current teacher
 */
export const getClassAssignmentsByTeacherId = async (): Promise<
  ClassAssignmentAttendanceResponse[]
> => {
  const response = await api.get("/api/class-assignment/teacher");
  return response.data;
};
