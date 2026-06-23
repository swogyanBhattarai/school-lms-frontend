export const studentFeeKeys = {
  all: ["student-fees"] as const,
  byStudent: (studentId: number) => ["student-fees", studentId] as const,
};
