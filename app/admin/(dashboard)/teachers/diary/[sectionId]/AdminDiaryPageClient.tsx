"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Calendar, FileText, Save, Sparkles, PenLine, GraduationCap, User, Users } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";

import { getSectionById } from "@/lib/api/section";
import { createDiary, updateDiaryAdmin, findAllFiltered } from "@/lib/api/diary";
import type { DiaryCreate, DiaryUpdateAdmin } from "@/types/lms";

export default function AdminDiaryPageClient({
  initialSubjectId,
  initialTeacherId,
  initialDiaryDate,
  initialSubjectName,
  initialTeacherName,
  initialGrade,
}: {
  initialSubjectId?: string;
  initialTeacherId?: string;
  initialDiaryDate?: string;
  initialSubjectName?: string;
  initialTeacherName?: string;
  initialGrade?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const sectionId = parseInt(params.sectionId as string);
  const subjectId = parseInt(initialSubjectId || "0");
  const teacherId = parseInt(initialTeacherId || "0");
  const diaryDate = initialDiaryDate || new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [existingDiaryId, setExistingDiaryId] = useState<number | null>(null);

  const { data: section, isLoading: isSectionLoading } = useQuery({
    queryKey: ["section", sectionId],
    queryFn: () => getSectionById(sectionId),
    enabled: !!sectionId,
  });

  const { data: diaryResponse, isLoading: isDiaryLoading } = useQuery({
    queryKey: ["admin-diary", sectionId, subjectId, teacherId, diaryDate],
    queryFn: () =>
      findAllFiltered({
        sectionId,
        subjectId,
        teacherId,
        startDate: diaryDate,
        endDate: diaryDate,
        pageSize: 1,
        pageNum: 1,
      }),
    enabled: !!sectionId && !!subjectId && !!teacherId,
  });

  useEffect(() => {
    const entries = diaryResponse?.content ?? [];
    if (entries.length > 0) {
      const entry = entries[0];
      setTitle(entry.title);
      setContent(entry.content);
      setExistingDiaryId(entry.diaryId);
    } else {
      setTitle("");
      setContent("");
      setExistingDiaryId(null);
    }
  }, [diaryResponse]);

  const isEditing = existingDiaryId !== null;

  const createMutation = useMutation({
    mutationFn: (payload: DiaryCreate) => createDiary(payload),
    onSuccess: () => {
      toast({
        title: "Diary saved",
        description: "Diary entry has been created.",
      });
      router.push(`/admin/teachers/${teacherId}?tab=diary`);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to save diary",
        description: getApiErrorMessage(error, "Please try again."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DiaryUpdateAdmin }) =>
      updateDiaryAdmin(id, payload),
    onSuccess: () => {
      toast({
        title: "Diary updated",
        description: "Diary entry has been updated.",
      });
      router.push(`/admin/teachers/${teacherId}?tab=diary`);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to update diary",
        description: getApiErrorMessage(error, "Please try again."),
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    if (isEditing && existingDiaryId) {
      updateMutation.mutate({
        id: existingDiaryId,
        payload: {
          title: title.trim(),
          content: content.trim(),
          diaryDate,
          subjectId,
          teacherId,
        },
      });
    } else {
      createMutation.mutate({
        diaryDate,
        subjectId,
        teacherId,
        sectionId,
        title: title.trim(),
        content: content.trim(),
      });
    }
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const displayDate = new Date(diaryDate).toLocaleDateString("en-NP", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isLoading = isSectionLoading || isDiaryLoading;

  const SkeletonPulse = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%]", className)} />
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/teachers/${teacherId}?tab=diary`)}
          className="mt-0.5 h-9 w-9 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          {isLoading ? (
            <>
              <SkeletonPulse className="mb-1.5 h-7 w-48" />
              <SkeletonPulse className="h-4 w-56" />
            </>
          ) : (
            <>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                {isEditing ? "Edit Diary Entry" : "New Diary Entry"}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {displayDate}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-5">
          <SkeletonPulse className="h-20 w-full sm:h-20" />
          <SkeletonPulse className="h-72 w-full" />
          <div className="flex justify-end gap-3">
            <SkeletonPulse className="h-10 w-24" />
            <SkeletonPulse className="h-10 w-36" />
          </div>
        </div>
      ) : !section || !subjectId || !teacherId ? (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-slate-50 blur-2xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <FileText className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-700">Invalid parameters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Missing section, subject or teacher information.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-xl"
              onClick={() => router.push(`/admin/teachers/${teacherId}`)}
            >
              Back to Teacher
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Context Card */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Mobile Layout */}
            <div className="sm:hidden p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]">
                    <BookOpen className="h-[18px] w-[18px] text-indigo-500" />
                  </div>
                  <h2 className="truncate text-sm font-bold leading-tight">
                    {initialSubjectName || diaryResponse?.content?.[0]?.subjectName || `Subject #${subjectId}`}
                  </h2>
                </div>
                {isEditing && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-inset ring-amber-200/60">
                    <PenLine className="h-2.5 w-2.5" />
                    Edit
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {initialGrade && (
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50/80 px-2 py-2.5">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center">Class {initialGrade}</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50/80 px-2 py-2.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center">Sec {section.sectionName}</span>
                </div>
                {initialTeacherName && (
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50/80 px-2 py-2.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center truncate w-full">{initialTeacherName.split(' ')[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]">
                <BookOpen className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold leading-tight">
                  {initialSubjectName || diaryResponse?.content?.[0]?.subjectName || `Subject #${subjectId}`}
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {[
                    initialGrade && `Class ${initialGrade}`,
                    `Section ${section.sectionName}`,
                    initialTeacherName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {isEditing && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600 ring-1 ring-inset ring-amber-200/60">
                  <PenLine className="h-3 w-3" />
                  Editing
                </span>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-5 sm:py-5 space-y-5 sm:space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-700">
                Title
              </label>
              <div className="relative group">
                <Input
                  id="title"
                  placeholder="e.g. Algebra: Quadratic Equations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 border border-slate-200 bg-white px-4 text-[15px] shadow-sm transition-all duration-200 hover:border-slate-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-100 focus-visible:border-indigo-300 sm:text-base"
                  maxLength={255}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-100" />

            {/* Content Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="content" className="text-sm font-medium text-slate-700">
                  Content
                </label>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors",
                  content.length > 0 ? "bg-slate-100 text-slate-500 font-medium" : "bg-transparent text-slate-300",
                )}>
                  {content.length}
                </span>
              </div>
              <div className="relative group">
                <textarea
                  id="content"
                  rows={8}
                  placeholder="What was covered today? Any notes, observations, or homework assigned…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn(
                    "w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm transition-all duration-200",
                    "placeholder:text-slate-400",
                    "hover:border-slate-300",
                    "focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100 focus-visible:border-indigo-300",
                    "min-h-[200px] sm:min-h-[240px]",
                  )}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2.5 pt-1">
            <Button
              variant="ghost"
              onClick={() => router.push(`/admin/teachers/${teacherId}?tab=diary`)}
              className="rounded-xl px-5 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSave || isPending}
              className={cn(
                "relative rounded-xl px-6 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all",
                "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]",
                "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isEditing ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isEditing ? "Update Diary" : "Save Diary"}
                </span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}