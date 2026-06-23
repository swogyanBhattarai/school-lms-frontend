import api from "@/lib/api";
import type {
  DiaryCreate,
  DiaryResponse,
  DiaryUpdate,
  DiaryUpdateAdmin,
  PageResponse,
} from "@/types/lms";

export interface DiaryFilterParams {
  sectionId?: number;
  subjectId?: number;
  teacherId?: number;
  academicYearId?: number;
  startDate?: string;
  endDate?: string;
  pageNum?: number;
  pageSize?: number;
  sortDir?: string;
}

export const createDiary = async (payload: DiaryCreate): Promise<string> => {
  const res = await api.post<string>("/api/diary", payload);
  return res.data;
};

export const findAllFiltered = async (
  params: DiaryFilterParams
): Promise<PageResponse<DiaryResponse>> => {
  const res = await api.get<PageResponse<DiaryResponse>>("/api/diary", {
    params,
  });
  return res.data;
};

export const updateDiary = async (
  diaryId: number,
  payload: DiaryUpdate
): Promise<string> => {
  const res = await api.put<string>(`/api/diary/${diaryId}`, payload);
  return res.data;
};

export const updateDiaryAdmin = async (
  diaryId: number,
  payload: DiaryUpdateAdmin
): Promise<string> => {
  const res = await api.put<string>(`/api/diary/admin/${diaryId}`, payload);
  return res.data;
};

export const deleteDiary = async (diaryId: number): Promise<void> => {
  await api.delete(`/api/diary/${diaryId}`);
};
