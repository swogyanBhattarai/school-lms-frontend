import api from "@/lib/api";
import type {
  SubjectResponse,
  SubjectCreate,
  SubjectModel,
  SubjectUpdate,
  SubjectAttendanceResponse,
  SubjectDiaryResponse,
} from "@/types/lms";

/**
 * Fetch all subjects
 */
export const getAllSubjects = async (): Promise<SubjectResponse[]> => {
  const response = await api.get<SubjectResponse[]>("/api/subject");
  return response.data;
};

/**
 * Fetch a single subject by ID
 */
export const getSubjectById = async (id: number): Promise<SubjectResponse> => {
  const response = await api.get<SubjectResponse>(`/api/subject/${id}`);
  return response.data;
};

/**
 * Fetch attendance stats for a subject on a given date
 */
export const getSubjectAttendanceStats = async (
  subjectId: number,
  attendanceDate: string,
  classId?: number
): Promise<SubjectAttendanceResponse[]> => {
  const response = await api.get<SubjectAttendanceResponse[]>(
    "/api/subject/admin/attendance-stats",
    { params: { subjectId, attendanceDate, ...(classId ? { classId } : {}) } }
  );
  return response.data;
};

/**
 * Fetch diary stats for a subject on a given date
 */
export const getSubjectDiaryStats = async (
  subjectId: number,
  attendanceDate: string,
  classId?: number
): Promise<SubjectDiaryResponse[]> => {
  const response = await api.get<SubjectDiaryResponse[]>(
    "/api/subject/admin/diary-stats",
    { params: { subjectId, attendanceDate, ...(classId ? { classId } : {}) } }
  );
  return response.data;
};

/**
 * Create a new subject
 */
export const createSubject = async (
  payload: SubjectCreate | SubjectModel
): Promise<SubjectModel> => {
  const response = await api.post<SubjectModel>("/api/subject", payload);
  return response.data;
};

/**
 * Update a subject
 */
export const updateSubject = async (
  id: number,
  payload: SubjectUpdate | SubjectModel
): Promise<SubjectModel> => {
  const response = await api.put<SubjectModel>(`/api/subject/${id}`, payload);
  return response.data;
};

/**
 * Delete a subject
 */
export const deleteSubject = async (id: number): Promise<void> => {
  await api.delete(`/api/subject/${id}`);
};
