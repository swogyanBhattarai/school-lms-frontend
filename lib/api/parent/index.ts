import api from "@/lib/api";
import type { ParentCreate, ParentUpdate, ParentResponse } from "@/types/lms";

export const addParentToStudent = async (
  studentId: number,
  data: ParentCreate
): Promise<ParentResponse> => {
  const res = await api.post<ParentResponse>(`/api/student/${studentId}/parents`, data);
  return res.data;
};

export const updateParentOfStudent = async (
  studentId: number,
  parentId: number,
  data: ParentUpdate
): Promise<ParentResponse> => {
  const res = await api.put<ParentResponse>(`/api/student/${studentId}/parents/${parentId}`, data);
  return res.data;
};

export const removeParentFromStudent = async (
  studentId: number,
  parentId: number
): Promise<void> => {
  await api.delete(`/api/student/${studentId}/parents/${parentId}`);
};
