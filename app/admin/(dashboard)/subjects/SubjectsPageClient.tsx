"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  BookOpen,
  AlertCircle,
  UserCheck,
  RefreshCw,
  FlaskConical,
  Calculator,
  Globe,
  Monitor,
  Languages,
  Heart,
  Atom,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import DebouncedSearchInput from "@/app/_components/ui/DebouncedSearchInput";
import { Badge } from "@/app/_components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
} from "@/lib/api/subject";
import type {
  SubjectResponse,
  SubjectCreate,
  SubjectUpdate,
} from "@/types/lms";

// Constants
const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  Mathematics: Calculator,
  Science: FlaskConical,
  English: Languages,
  Nepali: Languages,
  "Social Studies": Globe,
  "Computer Science": Monitor,
  Physics: Atom,
  "Health & PE": Heart,
};

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
];

export default function SubjectsPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(
    null
  );
  const [deleteDialog, setDeleteDialog] = useState<SubjectResponse | null>(
    null
  );

  // Form states
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");

  // Fetch subjects
  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useQuery<SubjectResponse[]>({
    queryKey: ["subjects"],
    queryFn: () => getAllSubjects(),
  });

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (payload: SubjectCreate) => createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setAddDialogOpen(false);
      setNewSubjectName("");
      toast({
        title: "Subject added",
        description: "New subject has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add subject",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubjectUpdate }) =>
      updateSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setEditDialogOpen(false);
      setEditingSubject(null);
      setEditSubjectName("");
      toast({
        title: "Subject updated",
        description: "Subject details have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update subject",
        description: getApiErrorMessage(
          error,
          "Please check the details and try again."
        ),
        variant: "destructive",
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: number) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setDeleteDialog(null);
      toast({
        title: "Subject deleted",
        description: "The subject has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete subject",
        description: getApiErrorMessage(error, "Please try again later."),
        variant: "destructive",
      });
    },
  });

  // Computed data
  const filteredSubjects = useMemo(() => {
    let result = subjects;

    // Search filter
    if (debouncedSearch.trim()) {
      const normalizedSearch = debouncedSearch.trim().toLowerCase();
      result = result.filter((subject) =>
        subject.subjectName.toLowerCase().includes(normalizedSearch)
      );
    }

    return result;
  }, [subjects, debouncedSearch]);

  // Stats calculations
  const totalSubjects = subjects.length;

  const getSubjectIcon = (subjectName: string) => {
    return SUBJECT_ICONS[subjectName] || BookOpen;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage academic subjects and curriculum
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Add Subject
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-semibold">
            All Subjects
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
              {filteredSubjects.length} total
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <DebouncedSearchInput
            value={debouncedSearch}
            placeholder="Search subjects..."
            onChange={(val) => {
              setDebouncedSearch(val);
            }}
            className="flex-1 sm:flex-initial sm:w-64"
            inputClassName="h-9"
          />
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {subjectsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground animate-spin" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading subjects...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {subjectsError && !subjectsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Failed to load subjects
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSubjects()}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!subjectsLoading && !subjectsError && filteredSubjects.length === 0 && (
        <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No subjects found</p>
          {debouncedSearch && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                setDebouncedSearch("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {!subjectsLoading && !subjectsError && filteredSubjects.length > 0 && (
        <>
        {viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSubjects.map((subject, index) => {
            const Icon = getSubjectIcon(subject.subjectName);
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return (
              <div
                key={subject.subjectId}
                className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden"
                onClick={() =>
                  router.push(`/admin/subjects/${subject.subjectId}`)
                }
              >
                <div className="p-5">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 text-blue-600")} />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 font-medium flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>

                  {/* Subject Info */}
                  <h3 className="text-sm font-semibold mb-1">
                    {subject.subjectName}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/subjects/${subject.subjectId}`);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog(subject);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubjects.map((subject, index) => {
                  const Icon = getSubjectIcon(subject.subjectName);

                  return (
                    <tr
                      key={subject.subjectId}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/subjects/${subject.subjectId}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"
                            )}
                          >
                            <Icon className={cn("w-4 h-4 text-blue-600")} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {subject.subjectName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(subject);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Subject
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Add a new subject to the school curriculum.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">Subject Information</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject Name
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter subject name"
                className="h-10 sm:h-11"
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newSubjectName.trim()) {
                  toast({
                    title: "Missing name",
                    description: "Subject name is required.",
                  });
                  return;
                }
                createSubjectMutation.mutate({
                  subjectName: newSubjectName.trim(),
                } as SubjectCreate);
              }}
              disabled={createSubjectMutation.isPending}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {createSubjectMutation.isPending ? "Adding..." : "Add Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Subject
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update subject information.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">Subject Information</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject Name
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter subject name"
                className="h-10 sm:h-11"
                value={editSubjectName}
                onChange={(event) => setEditSubjectName(event.target.value)}
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingSubject(null);
              }}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editSubjectName.trim()) {
                  toast({
                    title: "Missing name",
                    description: "Subject name is required.",
                  });
                  return;
                }
                if (editingSubject?.subjectId) {
                  updateSubjectMutation.mutate({
                    id: editingSubject.subjectId,
                    payload: {
                      subjectName: editSubjectName.trim(),
                    } as SubjectUpdate,
                  });
                }
              }}
              disabled={updateSubjectMutation.isPending}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              {updateSubjectMutation.isPending
                ? "Updating..."
                : "Update Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title="Delete Subject?"
        description={
          <>
            This will permanently remove{" "}
            <strong>{deleteDialog?.subjectName}</strong> and all associated
            data. This action cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteDialog?.subjectId) {
            deleteSubjectMutation.mutate(deleteDialog.subjectId);
          }
        }}
        isPending={deleteSubjectMutation.isPending}
      />
    </div>
  );
}
