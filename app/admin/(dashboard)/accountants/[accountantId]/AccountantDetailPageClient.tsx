"use client";
import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Copy,
  Key,
  Shield,
  ShieldCheck,
  ShieldOff,
  Pencil,
  Save,
  X,
  Phone,
  ClipboardCheck,
  Loader2,
  Search,
  DollarSign,
  FileText,
  UserPlus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
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
import { cn, getApiErrorMessage } from "@/lib/utils";
import { toast } from "@/app/_components/ui/use-toast";
import { getAccountantById, updateAccountant } from "@/lib/api/accountant";
import { getAccountantUser, updateAccountantCredentials } from "@/lib/api/user";
import type { AccountantResponse, AccountantUpdate, AccountantUser } from "@/types/lms";

// ─── Mock Activity Data ──────────────────────────────────────────────────────
interface ActivityItem {
  id: number;
  action: string;
  detail: string;
  timestamp: string;
  type: "payment" | "create" | "edit" | "delete" | "warning";
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 1, action: "Fee Payment", detail: "Collected Rs. 5,000 from Aarav Shrestha for Monthly Fee", timestamp: "2026-07-18T10:30:00", type: "payment" },
  { id: 2, action: "Fee Created", detail: "Created annual fee of Rs. 12,000 for Class 5 - Section A", timestamp: "2026-07-18T09:15:00", type: "create" },
  { id: 3, action: "Payment Recorded", detail: "Recorded Rs. 3,500 from Aayush Shrestha for Examination Fee", timestamp: "2026-07-17T14:20:00", type: "payment" },
  { id: 4, action: "Fee Waiver", detail: "Applied 25% discount on Monthly Fee for Aarav Shrestha", timestamp: "2026-07-17T11:45:00", type: "edit" },
  { id: 5, action: "Overdue Reminder", detail: "Sent reminders for 12 overdue fees", timestamp: "2026-07-16T16:00:00", type: "warning" },
  { id: 6, action: "Fee Structure Updated", detail: "Updated monthly fee structure for Class 3", timestamp: "2026-07-16T10:30:00", type: "edit" },
  { id: 7, action: "Payment Recorded", detail: "Recorded Rs. 8,000 from Aarav Shrestha for Annual Fee", timestamp: "2026-07-15T13:10:00", type: "payment" },
  { id: 8, action: "Student Added", detail: "Added new student - Anaya Sharma to Class 2 - Section B", timestamp: "2026-07-14T09:00:00", type: "create" },
];

const ACTIVITY_CONFIG = {
  payment: { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  create: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  edit: { icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
  delete: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  warning: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
};

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-NP", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AccountantDetailPageClient() {
  const router = useRouter();
  const params = useParams();
  const accountantId = Number(params.accountantId);
  const queryClient = useQueryClient();

  const {
    data: accountantInfo,
    isLoading,
    isError,
    error,
  } = useQuery<AccountantResponse>({
    queryKey: ["accountant", accountantId],
    queryFn: () => getAccountantById(accountantId),
    enabled: Number.isFinite(accountantId) && accountantId > 0,
  });

  // Fetch accountant user for credentials
  const { data: accountantUser } = useQuery<AccountantUser>({
    queryKey: ["accountant-user", accountantId],
    queryFn: () => getAccountantUser(accountantId),
    enabled: Number.isFinite(accountantId) && accountantId > 0,
  });

  // Edit profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: AccountantUpdate) => updateAccountant(accountantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountant", accountantId] });
      setIsEditingProfile(false);
      toast({ title: "Accountant updated", description: "Profile has been updated." });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Toggle edit permission mutation
  const { mutate: togglePermission, isPending: isTogglingPermission } = useMutation({
    mutationFn: (newPermission: boolean) =>
      updateAccountant(accountantId, {
        accountantName: accountantInfo!.accountantName,
        accountantPhoneNumber: accountantInfo!.accountantPhoneNumber,
        editPermission: newPermission,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountant", accountantId] });
      toast({ title: "Permission updated", description: "Edit permission has been updated." });
    },
    onError: (error) => {
      toast({
        title: "Failed to update permission",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Edit credentials mutation
  const { mutate: updateCredentials, isPending: isUpdatingCredentials } = useMutation({
    mutationFn: (payload: { username: string; password?: string }) =>
      updateAccountantCredentials(accountantId, {
        username: payload.username,
        password: payload.password || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountant-user", accountantId] });
      setShowCredentialsDialog(false);
      setIsEditingCredentials(false);
      toast({ title: "Credentials Updated", description: "Accountant credentials updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Failed to update credentials",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Activity state
  const [activitySearch, setActivitySearch] = useState("");

  // UI States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  // Credentials dialog states
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const initials = accountantInfo?.accountantName
    ? accountantInfo.accountantName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "AC";

  const username = accountantUser?.accountantUsername || accountantInfo?.accountantPhoneNumber || "";

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return MOCK_ACTIVITIES;
    const q = activitySearch.toLowerCase();
    return MOCK_ACTIVITIES.filter(
      (a) => a.action.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q)
    );
  }, [activitySearch]);

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateProfile({
        accountantName: editName.trim(),
        accountantPhoneNumber: editPhone.trim(),

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  // ─── Loading State ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading accountant details...</p>
        </div>
      </div>
    );
  }

  if (isError || !accountantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Accountant not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Could not load accountant details."}
          </p>
          <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 px-1 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 sm:pt-0">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Accountant Details</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-7">
              View accountant information and recent activity
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-7 sm:ml-0">
            <Button
              variant="outline" size="sm"
              onClick={() => { setIsEditingProfile(true); setEditName(accountantInfo.accountantName); setEditPhone(accountantInfo.accountantPhoneNumber); }}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => { setShowCredentialsDialog(true); setIsEditingCredentials(false); setEditUsername(accountantUser?.accountantUsername || accountantInfo?.accountantPhoneNumber || ""); setEditPassword(""); setConfirmPassword(""); }}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Key className="h-3.5 w-3.5 mr-1.5" /> Credentials
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Edit Profile</h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveProfile} disabled={isUpdating} className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs">
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setIsEditingProfile(false); setEditName(accountantInfo?.accountantName || ""); setEditPhone(accountantInfo?.accountantPhoneNumber || ""); }} className="h-8 rounded-lg text-xs">
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Accountant name" className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 sm:items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center ring-4 ring-blue-100">
                        <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <ClipboardCheck className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg sm:text-xl font-bold">{accountantInfo.accountantName}</h2>
                      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {accountantInfo.accountantPhoneNumber && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" /> <span>{accountantInfo.accountantPhoneNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Edit Permission Toggle */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-center sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
                        Edit Access
                      </p>
                      <button
                        onClick={() => togglePermission(!accountantInfo.editPermission)}
                        disabled={isTogglingPermission}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                          accountantInfo.editPermission
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
                        )}
                      >
                        {isTogglingPermission ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : accountantInfo.editPermission ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldOff className="h-3.5 w-3.5" />
                        )}
                        {accountantInfo.editPermission ? "Granted" : "Restricted"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Mobile Edit & Credentials */}
              {!isEditingProfile && (
                <div className="sm:hidden flex flex-col items-center gap-2 pt-3 mt-2 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => { setIsEditingProfile(true); setEditName(accountantInfo.accountantName); setEditPhone(accountantInfo.accountantPhoneNumber); }} className="h-9 px-4 rounded-xl text-xs">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                    </Button>
                    <div className="w-px h-9 bg-slate-200" />
                    <Button variant="outline" size="sm" onClick={() => { setShowCredentialsDialog(true); setIsEditingCredentials(false); setEditUsername(accountantUser?.accountantUsername || accountantInfo?.accountantPhoneNumber || ""); setEditPassword(""); setConfirmPassword(""); }} className="h-9 px-4 rounded-xl text-xs">
                      <Key className="h-3.5 w-3.5 mr-1.5" /> Credentials
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Recent Activity</h3>
            <Badge className="ml-auto text-[10px] sm:text-xs">
              {filteredActivities.length} of {MOCK_ACTIVITIES.length}
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
            />
          </div>

          {/* Activity List - Desktop */}
          <div className="hidden sm:block space-y-2">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No activity found</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type];
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all">
                    <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                        <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">{formatTime(activity.timestamp)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{activity.detail}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Activity List - Mobile (teacher page style) */}
          <div className="sm:hidden space-y-1">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No activity found</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type];
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-2.5 px-0 py-2.5 border-b border-slate-50 last:border-b-0">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", config.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{activity.action}</p>
                      <p className="text-[10px] text-slate-500 truncate">{activity.detail}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 whitespace-nowrap flex-shrink-0">
                      {new Date(activity.timestamp).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Key className="h-4.5 w-4.5 text-blue-600" />
              </div>
              Accountant Credentials
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
              Manage login credentials for {accountantInfo.accountantName}
            </DialogDescription>
          </DialogHeader>
          <div className="border-t" />
          {isEditingCredentials ? (
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Enter username" className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Enter new password" className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200" />
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
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Username</p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{username}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(username, "Username")} className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Key className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Password</p>
                      <p className="text-sm font-mono font-semibold text-foreground mt-0.5 tracking-widest">••••••••</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">These credentials are used by the accountant to log into their account. Share them securely.</p>
                </div>
              </div>
            </div>
          )}
          <div className="border-t" />
          <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {isEditingCredentials ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditingCredentials(false); setEditUsername(accountantUser?.accountantUsername || accountantInfo?.accountantPhoneNumber || ""); setEditPassword(""); setConfirmPassword(""); }} className="rounded-xl text-sm w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleSaveCredentials} disabled={isUpdatingCredentials} className="rounded-xl text-sm font-medium w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  {isUpdatingCredentials ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Credentials
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCredentialsDialog(false)} className="rounded-xl text-sm w-full sm:w-auto">Close</Button>
                <Button onClick={() => { setIsEditingCredentials(true); setEditUsername(accountantUser?.accountantUsername || accountantInfo?.accountantPhoneNumber || ""); setEditPassword(""); setConfirmPassword(""); }} className="rounded-xl text-sm font-medium w-full sm:w-auto">
                  <Pencil className="h-4 w-4 mr-2" /> Edit Credentials
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
