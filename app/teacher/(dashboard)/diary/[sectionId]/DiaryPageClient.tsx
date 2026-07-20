"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Calendar, Save, FileText } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";

import { getClassAssignmentsByTeacherId } from "@/lib/api/teacher";
import { createDiary } from "@/lib/api/diary";
import type { DiaryCreate } from "@/types/lms";

export default function DiaryPageClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const sectionId = parseInt(params.sectionId as string);
  const subjectId = parseInt(searchParams?.get("subjectId") || "0");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Fetch class assignments to get assignment details + teacherId
  const { data: assignments = [], isLoading: loadingAssignment } = useQuery({
    queryKey: ["teacher-class-assignments"],
    queryFn: getClassAssignmentsByTeacherId,
  });

  const assignment = assignments.find(
    (a) => a.sectionId === sectionId && a.subjectId === subjectId,
  );

  const today = new Date().toLocaleDateString("en-NP", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Diary creation mutation
  const diaryMutation = useMutation({
    mutationFn: (payload: DiaryCreate) => createDiary(payload),
    onSuccess: () => {
      toast({
        title: "Diary saved",
        description: "Your diary entry has been recorded.",
      });
      router.push("/teacher");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to save diary",
        description: getApiErrorMessage(error, "Please try again."),
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    diaryMutation.mutate({
      diaryDate: new Date().toISOString().split("T")[0],
      subjectId,
      teacherId: assignment!.teacherId,
      sectionId,
      title: title.trim(),
      content: content.trim(),
    });
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:bg-slate-100 h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
            New Diary Entry
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {today}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loadingAssignment ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
        </div>
      ) : !assignment ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">Assignment not found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Could not find this class assignment.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/teacher")}
          >
            Back to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {/* Context Card */}
          <div className="rounded-xl border bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base">
                  {assignment.subjectName}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Grade {assignment.grade} &bull; Section{" "}
                  {assignment.sectionName}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-xl border bg-white p-4 sm:p-5 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium mb-1.5"
              >
                Title
              </label>
              <Input
                id="title"
                placeholder="e.g. Algebra: Quadratic Equations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                maxLength={255}
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium mb-1.5"
              >
                Content
              </label>
              <textarea
                id="content"
                rows={8}
                placeholder="What did you cover today? Any notes, observations, or homework assigned..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-input bg-transparent px-3 py-2",
                  "text-sm shadow-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "resize-y min-h-[200px]",
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} character{content.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSave || diaryMutation.isPending}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {diaryMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Diary
                </span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
