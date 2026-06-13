import { Plus } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

type StudentsHeaderProps = {
  onAddStudent: () => void;
};

export default function StudentsHeader({ onAddStudent }: StudentsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all students across classes and sections
        </p>
      </div>
      <Button onClick={onAddStudent} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Student
      </Button>
    </div>
  );
}
