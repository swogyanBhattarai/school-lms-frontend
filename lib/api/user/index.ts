import api from "@/lib/api";
import type {
  TeacherUser,
  ParentUser,
  AccountantUser,
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

/**
 * Fetch accountant user credentials by accountant ID
 */
export const getAccountantUser = async (accountantId: number): Promise<AccountantUser> => {
  const response = await api.get<AccountantUser>(`/api/user/accountant/${accountantId}`);
  return response.data;
};

/**
 * Update accountant user credentials (username and/or password)
 */
export const updateAccountantCredentials = async (
  accountantId: number,
  payload: UserUpdateDTO
): Promise<string> => {
  const response = await api.put<string>(
    `/api/user/accountant/${accountantId}`,
    payload
  );
  return response.data;
};

/**
 * Fetch parent user credentials by parent ID
 */
export const getParentUser = async (parentId: number): Promise<ParentUser> => {
  const response = await api.get<ParentUser>(`/api/user/parent/${parentId}`);
  return response.data;
};

/**
 * Update parent user credentials (username and/or password)
 */
export const updateParentCredentials = async (
  parentId: number,
  payload: UserUpdateDTO
): Promise<string> => {
  const response = await api.put<string>(
    `/api/user/parent/${parentId}`,
    payload
  );
  return response.data;
};
