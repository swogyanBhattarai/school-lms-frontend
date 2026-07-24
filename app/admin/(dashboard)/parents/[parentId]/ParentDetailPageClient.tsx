"use client";
import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  Phone,
  ChevronRight,
  ChevronLeft,
  User,
  Copy,
  Key,
  Shield,
  Pencil,
  Save,
  X,
  GraduationCap,
  School,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn, getApiErrorMessage } from "@/lib/utils";
import MobileFilterBar from "@/app/_components/ui/MobileFilterBar";
import ClearFiltersButton from "@/app/_components/ui/ClearFiltersButton";
import { toast } from "@/app/_components/ui/use-toast";
import { getParentDetails, updateParentOfStudent } from "@/lib/api/parent";
import { getParentUser, updateParentCredentials } from "@/lib/api/user";
import type { ParentDetails, ParentStudentDetails, ParentUpdate, ParentUser } from "@/types/lms";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ParentDetailPageClient() {
  const router = useRouter();
  const params = useParams();
  const parentId = Number(params.parentId);

  const queryClient = useQueryClient();

  const {
    data: parentInfo,
    isLoading,
    isError,
    error,
  } = useQuery<ParentDetails>({
    queryKey: ["parent-details", parentId],
    queryFn: () => getParentDetails(parentId),
    enabled: Number.isFinite(parentId) && parentId > 0,
  });

  // Fetch parent user for credentials
  const { data: parentUser } = useQuery<ParentUser>({
    queryKey: ["parent-user", parentId],
    queryFn: () => getParentUser(parentId),
    enabled: Number.isFinite(parentId) && parentId > 0,
  });

  // Edit profile mutation
  const { mutate: updateParent, isPending: isUpdatingParent } = useMutation({
    mutationFn: (data: ParentUpdate) => updateParentOfStudent(parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-details", parentId] });
      setIsEditingProfile(false);
      toast({
        title: "Parent updated",
        description: "Parent profile has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update parent",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Edit credentials mutation
  const { mutate: updateCredentials, isPending: isUpdatingCredentials } = useMutation({
    mutationFn: (payload: { username: string; password?: string }) =>
      updateParentCredentials(parentId, {
        username: payload.username,
        password: payload.password || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-user", parentId] });
      setShowCredentialsDialog(false);
      setIsEditingCredentials(false);
      toast({
        title: "Credentials Updated",
        description: "Parent credentials have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update credentials",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // UI States
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Edit profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Credentials dialog states
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Expanded students (for those with multiple section assignments)
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());

  // Group children by studentId
  const groupedChildren = useMemo(() => {
    const map = new Map<number, ParentStudentDetails[]>();
    for (const child of parentInfo?.children || []) {
      const existing = map.get(child.studentId) || [];
      existing.push(child);
      map.set(child.studentId, existing);
    }
    return Array.from(map.entries()).map(([studentId, assignments]) => ({
      studentId,
      studentName: assignments[0].studentName,
      assignments,
      isSingle: assignments.length === 1,
    }));
  }, [parentInfo?.children]);

  // Filtered grouped children
  const filteredGroupedChildren = useMemo(() => {
    return groupedChildren.filter((group) => {
      const matchesSearch = group.studentName.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === "all" || group.assignments.some((a) => a.grade === gradeFilter);
      return matchesSearch && matchesGrade;
    });
  }, [groupedChildren, search, gradeFilter]);

  // Get unique grades for filter
  const uniqueGrades = useMemo(() => {
    if (!parentInfo?.children) return [];
    const grades = new Set(parentInfo.children.map((c) => c.grade));
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [parentInfo?.children]);

  // Active filters count
  const activeFiltersCount = [
    search.trim(),
    gradeFilter !== "all" ? gradeFilter : "",
  ].filter(Boolean).length;

  // Filter children
  const filteredChildren = useMemo(() => {
    if (!parentInfo?.children) return [];
    let filtered = [...parentInfo.children];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.studentName.toLowerCase().includes(searchLower) ||
          c.sectionName.toLowerCase().includes(searchLower) ||
          c.grade.includes(searchLower),
      );
    }

    if (gradeFilter !== "all") {
      filtered = filtered.filter((c) => c.grade === gradeFilter);
    }

    // Sort by grade then section
    filtered.sort((a, b) => {
      const gradeDiff = parseInt(a.grade) - parseInt(b.grade);
      if (gradeDiff !== 0) return gradeDiff;
      return a.sectionName.localeCompare(b.sectionName);
    });

    return filtered;
  }, [parentInfo?.children, search, gradeFilter]);

  const parentInitials = parentInfo?.parentName
    ? parentInfo.parentName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PA";

  // Username from the parent user API, fallback to phone number
  const username = parentUser?.parentUsername || parentInfo?.parentNumber || "";

  const clearFilters = () => {
    setSearch("");
    setGradeFilter("all");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateParent({
        parentName: editName.trim(),
        parentPhoneNumber: editPhone.trim(),
      });
    }
  };

  const handleSaveCredentials = () => {
    if (editPassword && editPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    updateCredentials({
      username: editUsername,
      ...(editPassword ? { password: editPassword } : {}),
    });
  };

  // ─── Loading State ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading parent details...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────
  if (isError || !parentInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Parent not found
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Could not load parent details."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 px-1 sm:px-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 sm:pt-0">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                Parent Details
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-7">
              View parent information and linked children
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-7 sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditingProfile(true);
                setEditName(parentInfo.parentName);
                setEditPhone(parentInfo.parentNumber);
              }}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCredentialsDialog(true);
                setIsEditingCredentials(false);
                setEditUsername(parentUser?.parentUsername || parentInfo?.parentNumber || "");
                setEditPassword("");
                setConfirmPassword("");
              }}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Credentials
            </Button>
          </div>
        </div>

        {/* Parent Profile Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Edit Profile</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={isUpdatingParent}
                        className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        {isUpdatingParent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditName(parentInfo?.parentName || "");
                          setEditPhone(parentInfo?.parentNumber || "");
                        }}
                        className="h-8 rounded-lg text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Parent name"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Phone number"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 sm:items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center ring-4 ring-blue-100">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {parentInitials}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg sm:text-xl font-bold">
                        {parentInfo.parentName}
                      </h2>
                      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {parentInfo.parentNumber && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{parentInfo.parentNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 justify-center sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Children
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {parentInfo.children.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Mobile Edit & Credentials */}
              {!isEditingProfile && (
                <div className="sm:hidden flex flex-col items-center gap-2 pt-3 mt-2 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setEditName(parentInfo.parentName);
                        setEditPhone(parentInfo.parentNumber);
                      }}
                      className="h-9 px-4 rounded-xl text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit Profile
                    </Button>
                    <div className="w-px h-9 bg-slate-200" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCredentialsDialog(true);
                        setIsEditingCredentials(false);
                        setEditUsername(parentUser?.parentUsername || parentInfo?.parentNumber || "");
                        setEditPassword("");
                        setConfirmPassword("");
                      }}
                      className="h-9 px-4 rounded-xl text-xs"
                    >
                      <Key className="h-3.5 w-3.5 mr-1.5" />
                      Credentials
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children List - Full width */}
        <div className="space-y-4">
            {/* Children Section Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Linked Children</h3>
              <Badge className="ml-auto text-[10px] sm:text-xs">
                {filteredGroupedChildren.length} of {groupedChildren.length}
              </Badge>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search children by name, grade, or section..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ClearFiltersButton
                activeFiltersCount={activeFiltersCount}
                onClick={clearFilters}
              />
            </div>

            {/* Mobile Filters */}
            <MobileFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search children..."
              gradeValue={gradeFilter}
              onGradeChange={setGradeFilter}
              gradeOptions={[
                { value: "all", label: "All Grades" },
                ...uniqueGrades.map((g) => ({ value: g, label: `Grade ${g}` })),
              ]}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
            />

            {/* Children Cards */}
            {filteredGroupedChildren.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  No children found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroupedChildren.map((group, groupIdx) => {
                  const hasActive = group.assignments.some((a) => a.isActive);
                  const isExpanded = expandedStudents.has(group.studentId);

                  // Single assignment → direct row
                  if (group.isSingle) {
                    const single = group.assignments[0];
                    const isClickable = single.isActive;
                    return (
                      <div
                        key={`${group.studentId}-single`}
                        className={cn(
                          "group flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border transition-all",
                          isClickable
                            ? "border-slate-200/80 hover:border-blue-200 hover:shadow-md cursor-pointer active:scale-[0.99]"
                            : "border-slate-100/60 opacity-60 cursor-default",
                        )}
                        onClick={() =>
                          isClickable && router.push(`/admin/students/${group.studentId}`)
                        }
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br flex items-center justify-center transition-colors",
                            isClickable
                              ? "from-slate-100 to-slate-200 group-hover:from-blue-50 group-hover:to-blue-100"
                              : "from-slate-50 to-slate-100",
                          )}>
                            <User className={cn(
                              "h-5 w-5 transition-colors",
                              isClickable ? "text-slate-500 group-hover:text-blue-600" : "text-slate-300",
                            )} />
                          </div>
                          <div className={cn(
                            "absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors",
                            isClickable ? "bg-slate-200 group-hover:bg-blue-200" : "bg-slate-100",
                          )}>
                            <span className={cn(
                              "text-[8px] sm:text-[9px] font-bold transition-colors",
                              isClickable ? "text-slate-600 group-hover:text-blue-700" : "text-slate-300",
                            )}>
                              {groupIdx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-semibold text-sm truncate transition-colors",
                            isClickable ? "group-hover:text-blue-700" : "text-slate-500",
                          )}>
                            {single.studentName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] sm:text-xs">
                              <GraduationCap className="h-3 w-3" />
                              Class {single.grade}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] sm:text-xs">
                              <School className="h-3 w-3" />
                              Section {single.sectionName}
                            </span>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] sm:text-xs font-medium",
                              single.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-400 border-slate-200",
                            )}>
                              {single.academicYear}
                              {single.isActive && " (Active)"}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isClickable ? (
                            <>
                              <span className="hidden sm:inline text-xs text-muted-foreground">
                                View Details
                              </span>
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-slate-400 italic">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Multiple assignments → expandable row
                  return (
                    <div key={`${group.studentId}-multi`} className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                      {/* Parent row — always clickable to toggle expand */}
                      <div
                        className="flex items-center gap-3 p-3 sm:p-4 transition-all cursor-pointer hover:bg-slate-50"
                        onClick={() => {
                          const next = new Set(expandedStudents);
                          if (isExpanded) next.delete(group.studentId);
                          else next.add(group.studentId);
                          setExpandedStudents(next);
                        }}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-blue-700">
                              {groupIdx + 1}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {group.studentName}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {group.assignments.length} section assignments
                            {hasActive && " • Active year available"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ChevronRight className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform",
                            isExpanded && "rotate-90",
                          )} />
                        </div>
                      </div>

                      {/* Expanded children */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {group.assignments.map((assignment) => {
                            const isClickable = assignment.isActive;
                            return (
                              <div
                                key={assignment.academicYear}
                                className={cn(
                                  "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 transition-all",
                                  isClickable
                                    ? "cursor-pointer hover:bg-blue-50/50"
                                    : "opacity-50 cursor-default",
                                )}
                                onClick={() =>
                                  isClickable && router.push(`/admin/students/${assignment.studentId}`)
                                }
                              >
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center flex-shrink-0">
                                  <GraduationCap className={cn(
                                    "h-4 w-4",
                                    isClickable ? "text-slate-500" : "text-slate-300",
                                  )} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold text-slate-700">
                                      Class {assignment.grade}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500">
                                      Section {assignment.sectionName}
                                    </span>
                                  </div>
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] sm:text-xs font-medium w-fit",
                                    assignment.isActive
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-50 text-slate-400 border-slate-200",
                                  )}>
                                    {assignment.academicYear}
                                    {assignment.isActive && " (Active)"}
                                  </span>
                                </div>
                                <div className="flex-shrink-0">
                                  {isClickable ? (
                                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info Banner */}
            {filteredChildren.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                  Click on a student with a single active assignment to go directly to their profile. Students with multiple assignments can be expanded to choose the active year.
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Credentials Dialog */}
      <Dialog
        open={showCredentialsDialog}
        onOpenChange={setShowCredentialsDialog}
      >
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Key className="h-4.5 w-4.5 text-blue-600" />
              </div>
              Parent Credentials
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
              Manage login credentials for {parentInfo.parentName}
            </DialogDescription>
          </DialogHeader>

          <div className="border-t" />

          {isEditingCredentials ? (
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                    className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Username
                      </p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                        {username}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(username, "Username")}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Key className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Password
                      </p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5 tracking-widest">
                        ••••••••
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    These credentials are used by the parent to log into their account. Share them securely with the parent.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t" />

          <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {isEditingCredentials ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingCredentials(false);
                    setEditUsername(parentUser?.parentUsername || parentInfo?.parentNumber || "");
                    setEditPassword("");
                    setConfirmPassword("");
                  }}
                  className="rounded-xl text-sm w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCredentials}
                  disabled={isUpdatingCredentials}
                  className="rounded-xl text-sm font-medium w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingCredentials ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Credentials
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCredentialsDialog(false)}
                  className="rounded-xl text-sm w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingCredentials(true);
                    setEditUsername(parentUser?.parentUsername || parentInfo?.parentNumber || "");
                    setEditPassword("");
                    setConfirmPassword("");
                  }}
                  className="rounded-xl text-sm font-medium w-full sm:w-auto"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Credentials
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
