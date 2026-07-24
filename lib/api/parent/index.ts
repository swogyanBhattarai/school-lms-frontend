import api from "@/lib/api";
import type {
  ParentCreate,
  ParentUpdate,
  ParentResponse,
  ParentListResponse,
  ParentDashboardParams,
  ParentDetails,
  PageResponse,
} from "@/types/lms";

export const addParentToStudent = async (
  studentId: number,
  data: ParentCreate
): Promise<ParentResponse> => {
  const res = await api.post<ParentResponse>(`/api/parents/student/${studentId}`, data);
  return res.data;
};

export const updateParentOfStudent = async (
  parentId: number,
  data: ParentUpdate
): Promise<ParentResponse> => {
  const res = await api.put<ParentResponse>(`/api/parents/${parentId}`, data);
  return res.data;
};

export const removeParentFromStudent = async (
  parentId: number
): Promise<void> => {
  await api.delete(`/api/parents/${parentId}`);
};

export const getParentDashboard = async (
  params: ParentDashboardParams
): Promise<PageResponse<ParentListResponse>> => {
  const res = await api.get<PageResponse<ParentListResponse>>("/api/parents/dashboard", {
    params,
  });
  return res.data;
};

export const getParentDetails = async (
  parentId: number
): Promise<ParentDetails> => {
  const res = await api.get<ParentDetails>(`/api/parents/${parentId}/details`);
  return res.data;
};
