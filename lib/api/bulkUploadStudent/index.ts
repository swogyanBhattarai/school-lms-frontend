import api from "@/lib/api";
import type { StudentBulkUploadResponse } from "@/types/lms";

export const bulkCreateAndAssignStudents = async (
  sectionId: number,
  file: File
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<string>(
    `/api/student-bulk-upload/section/${sectionId}`,
    formData
  );

  return response.data;
};

export const getBulkUploadResultBySectionId = async (
  sectionId: number
): Promise<StudentBulkUploadResponse> => {
  const response = await api.get<StudentBulkUploadResponse>(
    `/api/student-bulk-upload/section/${sectionId}`
  );

  return response.data;
};