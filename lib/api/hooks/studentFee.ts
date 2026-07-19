export const studentFeeKeys = {
  all: ["student-fees"] as const,
  byStudent: (studentId: number) => ["student-fees", studentId] as const,
  adminStats: ["student-fees", "admin-stats"] as const,
  adminClassStats: ["student-fees", "admin-stats", "class"] as const,
  adminOverdueStudents: ["student-fees", "admin-stats", "overdue"] as const,
};
