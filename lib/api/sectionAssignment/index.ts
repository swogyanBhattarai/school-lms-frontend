import api from '@/lib/api';
import type { StudentCreate } from '@/types/lms';

export interface SectionAssignmentCreate {
  sectionId: number;
  studentId: number;
}

export interface SectionAssignmentResponse {
  sectionAssignmentId: number;
  sectionId: number;
  studentId: number;
  studentName: string;
}

/**
 * Create a student and assign them to a section in one step
 */
export const createStudentAndAssignToSection = async (
  sectionId: number,
  student: StudentCreate
): Promise<SectionAssignmentResponse> => {
  const response = await api.post<SectionAssignmentResponse>(
    `/api/section-assignment/create-and-assign-to/${sectionId}`,
    student
  );
  return response.data;
};

/**
 * Add an existing student to a section
 */
export const addStudentToSection = async (
  sectionId: number,
  studentId: number
): Promise<SectionAssignmentResponse> => {
  const response = await api.post<SectionAssignmentResponse>(
    '/api/section-assignment',
    {
      sectionId,
      studentId,
    }
  );
  return response.data;
};

/**
 * Get all students in a section
 */
export const getStudentsBySection = async (
  sectionId: number
): Promise<SectionAssignmentResponse[]> => {
  const response = await api.get<SectionAssignmentResponse[]>(
    `/api/section-assignment/section/${sectionId}`
  );
  return response.data;
};

/**
 * Get a student's assignment for the active year
 */
export const getByStudentIdAndActiveYear = async (
  studentId: number
): Promise<SectionAssignmentResponse> => {
  const response = await api.get<SectionAssignmentResponse>(
    `/api/section-assignment/student/${studentId}`
  );
  return response.data;
};

/**
 * Remove a student from a section
 */
export const removeStudentFromSection = async (
  assignmentId: number
): Promise<void> => {
  await api.delete(`/api/section-assignment/${assignmentId}`);
};

/**
 * Remove all students from a section
 */
export const deleteAllStudentsFromSection = async (
  sectionId: number
): Promise<void> => {
  await api.delete(`/api/section-assignment/section/${sectionId}`);
};
