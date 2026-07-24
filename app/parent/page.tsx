"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ChevronRight, Users, Loader2 } from "lucide-react";
import { me } from "@/lib/api/auth";
import api from "@/lib/api";
import type { CurrentUserInfoResponse } from "@/types/lms";

type ChildInfo = {
  studentId: number;
  studentName: string;
  grade: string;
  sectionName: string;
  academicYear: string;
  isActive: boolean;
};

type ParentDetailsData = {
  parentId: number;
  parentName: string;
  parentNumber: string;
  children: ChildInfo[];
};

export default function ParentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Step 1: Get current user info (includes parentId)
        const currentUser: CurrentUserInfoResponse = await me();

        if (!isMounted) return;

        if (!currentUser.parentId) {
          setError("Parent account not found. Please contact your school.");
          setLoading(false);
          return;
        }

        setParentName(currentUser.username);

        // Step 2: Fetch parent details with children list
        const details = await api.get<ParentDetailsData>(
          `/api/parents/${currentUser.parentId}/details`
        );

        if (!isMounted) return;

        setChildren(details.data.children || []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load parent data:", err);
        setError("Unable to load your children's information. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your children...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full mx-4 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="rounded-lg bg-primary px-6 py-2.5 text-primary-foreground font-semibold hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {parentName}
            </p>
          </div>
        </div>

        {/* Children list */}
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No children linked yet
            </h2>
            <p className="text-muted-foreground text-sm">
              Your account is not yet linked to any students. Please contact your school
              to link your children to this account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <Link
                key={child.studentId}
                href={`/parent/children/${child.studentId}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {child.studentName
                        ? child.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "?"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {child.studentName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Class {child.grade} &middot; Section {child.sectionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Academic Year: {child.academicYear}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
