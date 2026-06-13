"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Download,
  X,
  BookOpen,
  Loader2,
  AlertCircle,
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
  Check,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Badge } from "@/app/_components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/app/_components/ui/alert-dialog";
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
import  useHasMounted  from "@/lib/hooks/useHasMounted";

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

export default function SubjectsPage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const handleExport = () => {
    const data = subjects.map((subject) => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subjects-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${subjects.length} subjects exported successfully.`,
    });
  };

  if (!hasMounted) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage academic subjects and curriculum
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Subjects</p>
              <p className="text-xl font-bold">
                {subjectsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  totalSubjects
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">
            All Subjects
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {filteredSubjects.length} total
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
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

      {/* Subjects Display */}
      {subjectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading subjects...</p>
          </div>
        </div>
      ) : subjectsError ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load subjects
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSubjects()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="rounded-xl border bg-card py-20 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No subjects found</p>
          {debouncedSearch && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <Badge
                      className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-5 px-1.5 flex items-center gap-1 shadow-sm"
                    >
                      <Check className="h-3 w-3" />
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubject(subject);
                            setEditSubjectName(subject.subjectName);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(subject);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubject(subject);
                                setEditSubjectName(subject.subjectName);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog(subject);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Add Subject
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Add a new subject to the school curriculum.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
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
                className="h-11"
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              className="text-sm font-medium"
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
              className="gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {createSubjectMutation.isPending ? "Adding..." : "Add Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Edit Subject
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Update subject information.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-blue-600" />
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
                className="h-11"
                value={editSubjectName}
                onChange={(event) => setEditSubjectName(event.target.value)}
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingSubject(null);
              }}
              className="text-sm font-medium"
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
              className="gap-2 text-sm font-medium"
            >
              <Pencil className="h-4 w-4" />
              {updateSubjectMutation.isPending
                ? "Updating..."
                : "Update Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteDialog?.subjectName}</strong> and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSubjectMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteDialog?.subjectId) {
                  deleteSubjectMutation.mutate(deleteDialog.subjectId);
                }
              }}
            >
              {deleteSubjectMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}