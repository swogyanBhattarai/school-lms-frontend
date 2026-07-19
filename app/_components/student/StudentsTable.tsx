import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCircle,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import type { StudentResponse } from "@/types/lms";

const getInitial = (name: string) => {
  return name ? name.charAt(0).toUpperCase() : "?";
};

type StudentsTableProps = {
  students: StudentResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (student: StudentResponse) => void;
  onView: (studentId: number) => void;
  onDelete: (student: StudentResponse) => void;
};

export default function StudentsTable({
  students,
  loading,
  error,
  onRetry,
  onEdit,
  onView,
  onDelete,
}: StudentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              ID
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Student Name
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {error ? (
            <tr>
              <td colSpan={3} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">Failed to load students</p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </td>
            </tr>
          ) : students.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No students found</p>
                </div>
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr
                key={student.studentId}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-5 py-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{student.studentId}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">
                        {getInitial(student.studentName)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {student.studentName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        ID: {student.studentId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onView(student.studentId)}>
                        <UserCircle className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(student)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
