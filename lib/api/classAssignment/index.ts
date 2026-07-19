import api from "@/lib/api";
import type {
  ClassAssignmentCreate,
  ClassAssignmentUpdate,
  ClassAssignmentResponse,
  ClassAssignmentAttendanceResponse,
  ClassAssignmentModel,
} from "@/types/lms";

/**
 * Fetch all class assignments
 */
export const getAllClassAssignments = async (): Promise<ClassAssignmentModel[]> => {
  const response = await api.get<ClassAssignmentModel[]>("/api/class-assignment");
  return response.data;
};

/**
 * Fetch all class assignments for a specific section
 */
export const getClassAssignmentsBySection = async (sectionId: number): Promise<ClassAssignmentResponse[]> => {
  const response = await api.get<ClassAssignmentResponse[]>(
    `/api/class-assignment/section/${sectionId}`
  );
  return response.data;
};

/**
 * Fetch a single class assignment by ID
 */
export const getClassAssignmentById = async (id: number): Promise<ClassAssignmentModel> => {
  const response = await api.get<ClassAssignmentModel>(`/api/class-assignment/${id}`);
  return response.data;
};

/**
 * Create a new class assignment
 */
export const createClassAssignment = async (
  payload: ClassAssignmentCreate
): Promise<ClassAssignmentResponse> => {
  const response = await api.post<ClassAssignmentResponse>("/api/class-assignment", payload);
  return response.data;
};

/**
 * Update an existing class assignment
 */
export const updateClassAssignment = async (
  id: number,
  payload: ClassAssignmentUpdate
): Promise<ClassAssignmentResponse> => {
  const response = await api.put<ClassAssignmentResponse>(
    `/api/class-assignment/${id}`,
    payload
  );
  return response.data;
};

/**
 * Fetch class assignments for the current teacher
 */
export const getClassAssignmentsForTeacher = async (): Promise<
  ClassAssignmentAttendanceResponse[]
> => {
  const response = await api.get<ClassAssignmentAttendanceResponse[]>(
    "/api/class-assignment/teacher"
  );
  return response.data;
};

/**
 * Fetch class assignments for a specific teacher by ID (admin use)
 * Pass a date string (YYYY-MM-DD) to check attendance status for that day.
 */
export const getClassAssignmentsByTeacherId = async (
  teacherId: number,
  attendanceDate: string
): Promise<ClassAssignmentAttendanceResponse[]> => {
  const response = await api.get<ClassAssignmentAttendanceResponse[]>(
    `/api/class-assignment/teacher/${teacherId}`,
    { params: { attendanceDate } }
  );
  return response.data;
};

/**
 * Delete a class assignment
 */
export const deleteClassAssignment = async (id: number) => {
  await api.delete(`/api/class-assignment/${id}`);
};
