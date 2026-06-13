import api from "@/lib/api";

export const getSchoolNameById = async (id: number): Promise<string> => {
  const response = await api.get<string>(`/api/school/${id}`);
  return response.data;
};