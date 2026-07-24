"use client";
import { useState } from "react";
import { GraduationCap, BookOpen, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/utils";

export default function ParentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Parent login does not need schoolSlug — phone numbers are globally unique
      await login({ username: phone, password });
      router.replace("/parent");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Side - Branding/Info (2/3) */}
      <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-blue-800">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 text-white">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">EduManage</h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Parent
                <span className="block text-blue-200">Portal</span>
              </h2>
              <p className="text-lg text-blue-100/90 leading-relaxed max-w-md">
                Stay connected with your child&apos;s academic journey. Track attendance,
                classwork, and progress all in one place.
              </p>
            </div>
            <div className="grid gap-4 pt-8">
              <div className="flex items-center gap-3 text-blue-100">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm">View attendance and progress reports</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-sm">Track classwork and diary entries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (1/3) */}
      <div className="w-full lg:w-1/3 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">EduManage</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Parent Portal</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to view your child&apos;s progress
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                  type="tel"
                  autoComplete="username"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground font-semibold shadow-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="mt-1 w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-muted-foreground">
                Are you a teacher or administrator?{" "}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Sign in through your school portal
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
