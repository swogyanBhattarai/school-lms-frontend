import api from "@/lib/api";
import type {
  TeacherUser,
  UserUpdateDTO,
} from "@/types/lms";

/**
 * Fetch teacher user credentials by teacher ID
 */
export const getTeacherUser = async (teacherId: number): Promise<TeacherUser> => {
  const response = await api.get<TeacherUser>(`/api/user/teacher/${teacherId}`);
  return response.data;
};

/**
 * Update teacher user credentials (username and/or password)
 */
export const updateTeacherCredentials = async (
  teacherId: number,
  payload: UserUpdateDTO
): Promise<string> => {
  const response = await api.put<string>(
    `/api/user/teacher/${teacherId}`,
    payload
  );
  return response.data;
};
