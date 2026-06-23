"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  MoreHorizontal,
  BookOpen,
  CalendarDays,
  School,
  AlertCircle,
  Check,
  Power,
  GraduationCap,
  Layers,
  Clock,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
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
import { Badge } from "@/app/_components/ui/badge";
import { useToast } from "@/app/_components/ui/use-toast";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import {
  createAcademicYear,
  deleteAcademicYear,
  getAcademicYears,
  updateAcademicYear,
  setActiveAcademicYear,
} from "@/lib/api/academicYear";
import {
  createSchoolClass,
  deleteSchoolClass,
  updateSchoolClass,
} from "@/lib/api/schoolClass";
import {
  createSection,
  deleteSection,
  updateSection,
} from "@/lib/api/section";
import { convertADToBS, convertBSToAD, formatBSDate } from "@/lib/nepali-calendar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn, getApiErrorMessage } from "@/lib/utils";

// Types
import type {
  AcademicYearCreate,
  AcademicYearResponse,
  SchoolClassCreate,
  SchoolClassUpdate,
} from "@/types/lms";
import useHasMounted from "@/lib/hooks/useHasMounted";
import { AcademicYearsSkeleton } from "@/app/_components/skeletons/AcademicYearsSkeleton";

// Helper function to format date
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateWithBS(d: string) {
  if (!d) return "—";
  const adDate = new Date(d);
  const bsDate = convertADToBS(adDate);
  return `${fmtDate(d)} (${formatBSDate(bsDate.year, bsDate.month, bsDate.day)})`;
}

function fmtBSOnly(d: string) {
  if (!d) return "—";
  const adDate = new Date(d);
  const bsDate = convertADToBS(adDate);
  return formatBSDate(bsDate.year, bsDate.month, bsDate.day);
}

// Form types for CRUD operations
interface AcademicYearForm {
  name: string;
  startDate: string;
  endDate: string;
}

const blankAcademicYear = (): AcademicYearForm => ({
  name: "",
  startDate: "",
  endDate: "",
});

export default function AcademicYearsPage() {
  const hasMounted = useHasMounted();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  // Dialog states
  const [yearDialog, setYearDialog] = useState(false);
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editingYearApiId, setEditingYearApiId] = useState<number | null>(null);
  const [yearForm, setYearForm] = useState<AcademicYearForm>(blankAcademicYear());

  const [classDialog, setClassDialog] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [classAcademicYearId, setClassAcademicYearId] = useState<number | null>(null);
  const [classForm, setClassForm] = useState<SchoolClassCreate>({ grade: "", academicYearId: 0 });

  const [deleteDialog, setDeleteDialog] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [deleteClassDialog, setDeleteClassDialog] = useState<{
    id: number;
    grade: string;
  } | null>(null);

  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionClassId, setSectionClassId] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<{ sectionName: string }>({ sectionName: "" });

  const [deleteSectionDialog, setDeleteSectionDialog] = useState<{
    id: number;
    name: string;
    classId: number;
  } | null>(null);

  const {
    data: academicYearData,
    isLoading: academicYearsLoading,
    isError: academicYearsError,
    refetch: refetchAcademicYears,
  } = useQuery({
    queryKey: ["academic-years"],
    queryFn: getAcademicYears,
  });

  const createYearMutation = useMutation({
    mutationFn: (payload: AcademicYearCreate) => createAcademicYear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const updateYearMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AcademicYearCreate }) =>
      updateAcademicYear(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: number) => deleteAcademicYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: (payload: SchoolClassCreate) => createSchoolClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SchoolClassUpdate }) =>
      updateSchoolClass(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => deleteSchoolClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (payload: { sectionName: string; classId: number }) => createSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, sectionName }: { sectionId: number; sectionName: string }) =>
      updateSection(sectionId, { sectionName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: number) => deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const setActiveYearMutation = useMutation({
    mutationFn: (id: number) => setActiveAcademicYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({ title: "Success", description: "Academic year set as active." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Failed to set active academic year."),
        variant: "destructive",
      });
    },
  });

  // Sort and filter data
  const academicYears = useMemo(() => {
    const data = academicYearData ?? [];
    return data
      .sort((a, b) => a.academicYearId - b.academicYearId)
      .map(year => ({
        ...year,
        classes: (year.classes ?? [])
          .sort((a, b) => a.schoolClassId - b.schoolClassId)
          .map(cls => ({
            ...cls,
            sections: (cls.sections ?? [])
              .sort((a, b) => a.sectionId - b.sectionId)
          }))
      }));
  }, [academicYearData]);

  // Toggle accordion
  const toggleYear = (id: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClass = (id: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter years based on search
  const filteredYears = academicYears.filter(
    (y) =>
      y.academicYear.toLowerCase().includes(search.toLowerCase()) ||
      y.classes?.some(
        (cls) =>
          cls.grade.toLowerCase().includes(search.toLowerCase()) ||
          cls.sections?.some((sec) =>
            sec.sectionName.toLowerCase().includes(search.toLowerCase())
          )
      )
  );

  type ViewState = "loading" | "error" | "empty" | "content";
  const viewState: ViewState = academicYearsLoading
    ? "loading"
    : academicYearsError
      ? "error"
      : filteredYears.length === 0
        ? "empty"
        : "content";

  // Academic Year CRUD
  const openCreateYear = () => {
    setEditingYearId(null);
    setEditingYearApiId(null);
    setYearForm(blankAcademicYear());
    setYearDialog(true);
  };

  const openEditYear = (year: AcademicYearResponse) => {
    setEditingYearId(String(year.academicYearId));
    setEditingYearApiId(year.academicYearId);
    setYearForm({
      name: year.academicYear,
      startDate: year.startDate ?? "",
      endDate: year.endDate ?? "",
    });
    setYearDialog(true);
  };

  const openCreateClass = (academicYearId: number) => {
    setEditingClassId(null);
    setClassAcademicYearId(academicYearId);
    setClassForm({ grade: "", academicYearId });
    setClassDialog(true);
  };

  const openEditClass = (schoolClassId: number, grade: string, academicYearId: number) => {
    setEditingClassId(schoolClassId);
    setClassAcademicYearId(academicYearId);
    setClassForm({ grade, academicYearId });
    setClassDialog(true);
  };

  const openCreateSection = (schoolClassId: number) => {
    setEditingSectionId(null);
    setSectionClassId(schoolClassId);
    setSectionForm({ sectionName: "" });
    setSectionDialog(true);
  };

  const openEditSection = (sectionId: number, sectionName: string, schoolClassId: number) => {
    setEditingSectionId(sectionId);
    setSectionClassId(schoolClassId);
    setSectionForm({ sectionName });
    setSectionDialog(true);
  };

  const handleSaveYear = () => {
    if (!yearForm.name.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter an academic year.",
        variant: "destructive",
      });
      return;
    }

    if (!yearForm.startDate || !yearForm.endDate) {
      toast({
        title: "Validation error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(yearForm.endDate) <= new Date(yearForm.startDate)) {
      toast({
        title: "Validation error",
        description: "End date must be after the start date.",
        variant: "destructive",
      });
      return;
    }

    if (editingYearId && editingYearApiId) {
      updateYearMutation.mutate(
        {
          id: editingYearApiId,
          payload: {
            academicYear: yearForm.name.trim(),
            startDate: yearForm.startDate,
            endDate: yearForm.endDate,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: `${yearForm.name} has been updated.` });
            setYearDialog(false);
          },
          onError: (error) => {
            toast({
              title: "Failed to update academic year.",
              description: getApiErrorMessage(error, "Failed to update academic year."),
              variant: "destructive",
            });
          },
        }
      );
    } else if (!editingYearId) {
      createYearMutation.mutate({
        academicYear: yearForm.name.trim(),
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
      }, {
        onSuccess: () => {
          toast({ title: "Created", description: `${yearForm.name} has been added.` });
          setYearDialog(false);
          setYearForm(blankAcademicYear());
        },
        onError: (error) => {
          toast({
            title: "Failed to create academic year.",
            description: getApiErrorMessage(error, "Failed to create academic year."),
            variant: "destructive",
          });
        },
      });
    }
  };

  // Delete handlers
  const handleDelete = () => {
    if (!deleteDialog) return;

    const { id, name } = deleteDialog;
    deleteYearMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: `${name} has been removed.` });
        setDeleteDialog(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to delete academic year.",
          description: getApiErrorMessage(error, "Failed to delete academic year."),
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveClass = () => {
    if (!classForm.grade.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a class grade.",
        variant: "destructive",
      });
      return;
    }

    if (editingClassId) {
      updateClassMutation.mutate(
        {
          id: editingClassId,
          payload: { grade: classForm.grade.trim() },
        },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: "Class has been updated." });
            setClassDialog(false);
          },
          onError: (error) => {
            toast({
              title: "Failed to update class.",
              description: getApiErrorMessage(error, "Failed to update class."),
              variant: "destructive",
            });
          },
        }
      );
      return;
    }

    if (classAcademicYearId) {
      createClassMutation.mutate(
        {
          grade: classForm.grade.trim(),
          academicYearId: classAcademicYearId,
        },
        {
          onSuccess: () => {
            toast({ title: "Created", description: "Class has been added." });
            setClassDialog(false);
            setClassForm({ grade: "", academicYearId: classAcademicYearId });
          },
          onError: (error) => {
            toast({
              title: "Failed to create class.",
              description: getApiErrorMessage(error, "Failed to create class."),
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleDeleteClass = () => {
    if (!deleteClassDialog) return;

    deleteClassMutation.mutate(deleteClassDialog.id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Class has been removed." });
        setDeleteClassDialog(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to delete class.",
          description: getApiErrorMessage(error, "Failed to delete class."),
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveSection = () => {
    if (!sectionForm.sectionName.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a section name.",
        variant: "destructive",
      });
      return;
    }

    if (!sectionClassId) {
      toast({
        title: "Error",
        description: "Missing class for section.",
        variant: "destructive",
      });
      return;
    }

    if (editingSectionId) {
      updateSectionMutation.mutate(
        {
          sectionId: editingSectionId,
          sectionName: sectionForm.sectionName.trim(),
        },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: "Section has been updated." });
            setSectionDialog(false);
          },
          onError: (error) => {
            toast({
              title: "Failed to update section.",
              description: getApiErrorMessage(error, "Failed to update section."),
              variant: "destructive",
            });
          },
        }
      );
      return;
    }

    createSectionMutation.mutate(
      {
        sectionName: sectionForm.sectionName.trim(),
        classId: sectionClassId,
      },
      {
        onSuccess: () => {
          toast({ title: "Created", description: "Section has been added." });
          setSectionDialog(false);
          setSectionForm({ sectionName: "" });
        },
        onError: (error) => {
          toast({
            title: "Failed to create section.",
            description: getApiErrorMessage(error, "Failed to create section."),
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteSection = () => {
    if (!deleteSectionDialog) return;

    deleteSectionMutation.mutate(deleteSectionDialog.id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Section has been removed." });
        setDeleteSectionDialog(null);
      },
      onError: (error) => {
        toast({
          title: "Failed to delete section.",
          description: getApiErrorMessage(error, "Failed to delete section."),
          variant: "destructive",
        });
      },
    });
  };

  // Stats calculations
  const totalYears = academicYears.length;
  const activeYear = academicYears.find(y => y.isActive);
  const totalClasses = activeYear?.classes?.length ?? 0;
  const totalSections = activeYear?.classes?.reduce((sum, c) => sum + (c.sections?.length ?? 0), 0) ?? 0;
  
  const upcomingYears = academicYears.filter(
    y => !y.isActive && new Date(y.startDate) > new Date()
  ).length;

  if (!hasMounted) return <AcademicYearsSkeleton />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Academic Years</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage academic cycles, classes, and sections for your institution
          </p>
        </div>
        <Button onClick={openCreateYear} className="gap-2 shadow-sm text-sm w-full sm:w-auto">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          New Academic Year
        </Button>
      </div>

      {/* Main content with viewState transitions */}
      <div className="relative">
        {/* Loading */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "loading"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0",
          )}
        >
          <AcademicYearsSkeleton />
        </div>

        {/* Error */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "error"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0",
          )}
        >
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Error loading academic years
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetchAcademicYears()}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>

        {/* Empty */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "empty"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0",
          )}
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex-shrink-0" />
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="h-3 w-20 bg-muted rounded" />
                      <div className="h-5 w-12 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center py-12 sm:py-16 bg-card rounded-xl border-2 border-dashed">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Academic Years Found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm mx-auto px-4">
                {search ? "Try adjusting your search terms" : "Get started by creating your first academic year"}
              </p>
              {!search && (
                <Button onClick={openCreateYear} variant="outline" className="gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Create First Year
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "content"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0",
          )}
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Total Years</p>
                    <p className="text-lg sm:text-xl font-bold">{totalYears}</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Active Year</p>
                    <p className="text-lg sm:text-xl font-bold truncate max-w-[100px] sm:max-w-[120px]">
                      {activeYear?.academicYear || "None"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Active Classes</p>
                    <p className="text-lg sm:text-xl font-bold">{totalClasses}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Active Sections</p>
                    <p className="text-lg sm:text-xl font-bold">{totalSections}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search with Context */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search years, classes, or sections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-xs text-muted-foreground">
                  Found {filteredYears.length} {filteredYears.length === 1 ? 'year' : 'years'}
                </p>
              )}
            </div>

            {/* Enhanced Accordion List */}
            <div className="space-y-2 sm:space-y-3">
              {filteredYears.map((year) => (
            <div 
              key={year.academicYearId} 
              className={cn(
                "rounded-xl border bg-card shadow-sm transition-all duration-200",
                year.isActive && "ring-1 ring-emerald-500/30 border-emerald-500/40",
                expandedYears.has(String(year.academicYearId)) && "shadow-md"
              )}
            >
              {/* Year Header */}
              <div
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-muted/30 transition-colors group"
                onClick={() => toggleYear(String(year.academicYearId))}
              >
                <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all flex-shrink-0",
                      year.isActive 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : "bg-muted group-hover:bg-muted-foreground/10 text-muted-foreground"
                    )}
                  >
                    {year.academicYear.replace(/\D/g, "").slice(-2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{year.academicYear}</h3>
                      {year.isActive && (
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] h-5 px-2 flex items-center gap-1 font-medium">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 whitespace-normal overflow-hidden">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="sm:hidden">{fmtBSOnly(year.startDate)}</span>
                      <span className="hidden sm:inline">{fmtDateWithBS(year.startDate)}</span>
                      <span className="text-muted-foreground/40">→</span>
                      <span className="sm:hidden">{fmtBSOnly(year.endDate)}</span>
                      <span className="hidden sm:inline">{fmtDateWithBS(year.endDate)}</span>
                    </div>
                    {/* Mobile stats */}
                    <div className="sm:hidden flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <School className="h-3 w-3" />
                        {year.classes?.length ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {(year.classes ?? []).reduce((sum, c) => sum + (c.sections?.length ?? 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5" />
                    <span>{year.classes?.length ?? 0} classes</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>
                      {(year.classes ?? []).reduce((sum, c) => sum + (c.sections?.length ?? 0), 0)} sections
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!year.isActive && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setActiveYearMutation.mutate(year.academicYearId)}
                            className="gap-2"
                          >
                            <Power className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Set as Active</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => openEditYear(year)} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive gap-2"
                        onClick={() =>
                          setDeleteDialog({ id: year.academicYearId, name: year.academicYear })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="w-8 h-8 flex items-center justify-center">
                    {expandedYears.has(String(year.academicYearId)) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedYears.has(String(year.academicYearId)) && (
                <div className="border-t bg-muted/10 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/50">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">Classes</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 shadow-sm"
                      onClick={() => openCreateClass(year.academicYearId)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Class
                    </Button>
                  </div>
                  {(year.classes ?? []).length === 0 ? (
                    <div className="px-4 sm:px-6 py-8 sm:py-12">
                      <div className="rounded-xl border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 text-center">
                        <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">No classes yet</p>
                        <p className="text-xs text-muted-foreground">
                          Add your first class to get started
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {(year.classes ?? []).map((cls) => (
                        <div
                          key={cls.schoolClassId}
                          className="rounded-xl border bg-card/80 shadow-sm overflow-hidden transition-all hover:shadow-md"
                        >
                          {/* Class Header */}
                          <div
                            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-muted/20 transition-colors group/class"
                            onClick={() => toggleClass(String(cls.schoolClassId))}
                          >
                            <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  {cls.grade.length <= 4 ? cls.grade : cls.grade.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm">Grade {cls.grade}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {cls.sections?.length ?? 0} section{(cls.sections?.length ?? 0) !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openEditClass(cls.schoolClassId, cls.grade, year.academicYearId)
                                    }
                                    className="gap-2"
                                  >
                                    <Pencil className="h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive gap-2"
                                    onClick={() =>
                                      setDeleteClassDialog({ id: cls.schoolClassId, grade: cls.grade })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {expandedClasses.has(String(cls.schoolClassId)) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Sections */}
                          {expandedClasses.has(String(cls.schoolClassId)) && (
                            <div className="border-t bg-muted/5 animate-in slide-in-from-top-1 duration-200">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3 border-b border-border/30 gap-2 sm:gap-0">
                                <div>
                                  <p className="text-sm font-semibold">Sections</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Organize students into sections
                                  </p>
                                </div>
                                <Button                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-xs w-full sm:w-auto"
                                  onClick={() => openCreateSection(cls.schoolClassId)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Section
                                </Button>
                              </div>
                              {(cls.sections ?? []).length === 0 ? (
                                <div className="px-4 sm:px-5 py-6 sm:py-8 text-center">
                                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">No sections yet</p>
                                </div>
                              ) : (
                                <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                                  {(cls.sections ?? []).map((section) => (
                                    <div
                                      key={section.sectionId}
                                      onClick={() => router.push(`/admin/sections/${section.sectionId}`)}
                                      className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-background px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 transition-all cursor-pointer hover:shadow-sm group/section"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          router.push(`/admin/sections/${section.sectionId}`);
                                        }
                                      }}
                                    >
                                      <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs sm:text-sm font-bold text-amber-700">
                                            {section.sectionName}
                                          </span>
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-sm font-medium">Section {section.sectionName}</span>
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(event) => event.stopPropagation()}
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openEditSection(
                                                section.sectionId,
                                                section.sectionName,
                                                cls.schoolClassId
                                              );
                                            }}
                                            className="gap-2"
                                          >
                                            <Pencil className="h-4 w-4" /> Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-destructive gap-2"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setDeleteSectionDialog({
                                                id: section.sectionId,
                                                name: section.sectionName,
                                                classId: cls.schoolClassId,
                                              });
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" /> Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
          </div>
        </div>
      </div>

      {/* Academic Year Dialog */}
      <Dialog open={yearDialog} onOpenChange={setYearDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                {editingYearId ? "Edit Academic Year" : "New Academic Year"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                {editingYearId 
                  ? "Modify the academic year details and save your changes." 
                  : "Set up a new academic year by filling in the required information."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Academic Year Name
                <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="e.g., 2083 B.S."
                  value={yearForm.name}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 sm:h-11 pl-10 pr-4 text-sm"
                />
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[0.8rem] text-muted-foreground">
                Use the B.S. calendar format for consistency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="ay-start" className="text-sm font-medium">
                  Start Date <span className="text-destructive">*</span>
                </label>
                <MiniCalendar
                  value={
                    yearForm.startDate
                      ? (() => {
                          const ad = new Date(yearForm.startDate);
                          const bs = convertADToBS(ad);
                          return bs;
                        })()
                      : undefined
                  }
                  onChange={(isoString) => {
                    setYearForm((prev) => ({
                      ...prev,
                      startDate: isoString,
                    }));
                  }}
                  placeholder="Select start date"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="ay-end" className="text-sm font-medium">
                  End Date <span className="text-destructive">*</span>
                </label>
                <MiniCalendar
                  value={
                    yearForm.endDate
                      ? (() => {
                          const ad = new Date(yearForm.endDate);
                          const bs = convertADToBS(ad);
                          return bs;
                        })()
                      : undefined
                  }
                  onChange={(isoString) => {
                    setYearForm((prev) => ({
                      ...prev,
                      endDate: isoString,
                    }));
                  }}
                  placeholder="Select end date"
                />
              </div>
            </div>

            {yearForm.startDate && yearForm.endDate && (
              <div className="rounded-lg border bg-muted/30 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Duration</span>
                  </div>
                  <span className="font-medium tabular-nums">
                    {Math.round(
                      (new Date(yearForm.endDate).getTime() - new Date(yearForm.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setYearDialog(false)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {editingYearId && (
                <Button
                  variant="outline"
                  onClick={() => setYearForm(blankAcademicYear())}
                  className="text-sm flex-1 sm:flex-none"
                >
                  Reset
                </Button>
              )}
              <Button 
                onClick={handleSaveYear}
                className="text-sm font-medium gap-2 flex-1 sm:flex-none"
              >
                {editingYearId ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Year
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Year Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete Academic Year?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              This will permanently remove <strong>{deleteDialog?.name}</strong> and all associated data
              including classes, sections, and student records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t my-2" />
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Class Dialog */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                {editingClassId ? "Edit Class" : "Add Class"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                {editingClassId
                  ? "Modify class details and save your changes."
                  : "Create a new class under this academic year."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Grade <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., 10"
                value={classForm.grade}
                onChange={(e) => setClassForm((prev) => ({ ...prev, grade: e.target.value }))}
                className="h-10 sm:h-11"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Use clear naming like 1, 2, 3... or Nursery/LKG as per your school convention.
              </p>
            </div>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setClassDialog(false)} className="text-sm font-medium w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveClass} className="gap-2 text-sm font-medium w-full sm:w-auto">
              {editingClassId ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Class
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Class Dialog */}
      <AlertDialog
        open={!!deleteClassDialog}
        onOpenChange={(open) => !open && setDeleteClassDialog(null)}
      >
        <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Class?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              This will permanently remove Grade <strong>{deleteClassDialog?.grade}</strong> and all
              associated sections and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t my-2" />
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                {editingSectionId ? "Edit Section" : "Add Section"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                {editingSectionId
                  ? "Modify section details and save your changes."
                  : "Create a new section under this class."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Section Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., A"
                value={sectionForm.sectionName}
                onChange={(e) => setSectionForm({ sectionName: e.target.value })}
                className="h-10 sm:h-11"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Use short labels like A, B, or Blue.
              </p>
            </div>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setSectionDialog(false)} className="text-sm font-medium w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveSection} className="gap-2 text-sm font-medium w-full sm:w-auto">
              {editingSectionId ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Section
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Section Dialog */}
      <AlertDialog
        open={!!deleteSectionDialog}
        onOpenChange={(open) => !open && setDeleteSectionDialog(null)}
      >
        <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Section?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              This will permanently remove Section <strong>{deleteSectionDialog?.name}</strong> and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t my-2" />
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}