import api from "@/lib/api";
import type {
  FeePaymentCreate,
  StudentFeeCreate,
  StudentFeeModel,
} from "@/types/lms";

const BASE_URL = "/api/student-fee";

export const studentFeeApi = {
  createStudentFee: async (
    studentId: number,
    academicYearId: number,
    data: StudentFeeCreate
  ): Promise<string> => {
    const response = await api.post(`${BASE_URL}/${studentId}/${academicYearId}`, data);
    return response.data;
  },

  getAllByStudentId: async (studentId: number): Promise<StudentFeeModel[]> => {
    const response = await api.get<StudentFeeModel[]>(`${BASE_URL}/student/${studentId}`);
    return response.data;
  },

  createFeePayment: async (
    studentFeeId: number,
    data: FeePaymentCreate
  ): Promise<string> => {
    const response = await api.post(`${BASE_URL}/payment/${studentFeeId}`, data);
    return response.data;
  },

  deleteStudentFee: async (studentFeeId: number): Promise<void> => {
    const response = await api.delete(`${BASE_URL}/${studentFeeId}`);
    return response.data;
  },

  deleteFeePayment: async (feePaymentId: number): Promise<void> => {
    const response = await api.delete(`${BASE_URL}/payment/${feePaymentId}`);
    return response.data;
  },
};
