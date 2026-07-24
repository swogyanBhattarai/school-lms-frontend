// app/admin/(dashboard)/accountants/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  MoreHorizontal,
  Eye,
  Download,
  GraduationCap,
  Clock,
  UserCheck,
  UserX,
  School,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  LayoutGrid,
  List,
  ClipboardCheck,
  FileText,
  CalendarOff,
  Bell,
  CheckCircle2,
  BookOpen,
  Users,
  Pencil,
  MessageSquare,
  DollarSign,
  Wallet,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import DebouncedSearchInput from "@/app/_components/ui/DebouncedSearchInput";
import { Badge } from "@/app/_components/ui/badge";
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
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAccountant,
  getAllAccountants,
  deleteAccountant,
} from "@/lib/api/accountant";
import type {
  AccountantCreate,
  AccountantResponse,
} from "@/types/lms";

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    icon: UserCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  ON_LEAVE: {
    label: "On Leave",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  INACTIVE: {
    label: "Inactive",
    icon: UserX,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
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

interface ActivityItem {
  id: number;
  accountantId: number;
  accountantName: string;
  action: string;
  details: string;
  timestamp: string;
  type: "payment" | "fee" | "report" | "invoice" | "profile" | "reconcile" | "announcement";
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    accountantId: 1,
    accountantName: "Ram Prasad Bhattarai",
    action: "Payment collected",
    details: "Class 10 · Monthly Fee · Rs. 5,000",
    timestamp: "Today, 9:41 AM",
    type: "payment",
  },
  {
    id: 2,
    accountantId: 5,
    accountantName: "Nabin KC",
    action: "Fee structure updated",
    details: "Class 9 · Annual fee revised",
    timestamp: "Today, 8:15 AM",
    type: "fee",
  },
  {
    id: 3,
    accountantId: 3,
    accountantName: "Bikash Tamang",
    action: "Report generated",
    details: "Monthly collection report · December",
    timestamp: "Yesterday, 4:30 PM",
    type: "report",
  },
  {
    id: 4,
    accountantId: 2,
    accountantName: "Sita Kumari Sharma",
    action: "Invoice created",
    details: "Class 8 · Exam Fee · Rs. 1,200",
    timestamp: "Yesterday, 2:10 PM",
    type: "invoice",
  },
  {
    id: 5,
    accountantId: 7,
    accountantName: "Anita Rai",
    action: "Profile updated",
    details: "Phone number and email changed",
    timestamp: "Yesterday, 11:05 AM",
    type: "profile",
  },
  {
    id: 6,
    accountantId: 4,
    accountantName: "Deepak Adhikari",
    action: "Reconciliation done",
    details: "Bank statement matched · November",
    timestamp: "Dec 16, 3:45 PM",
    type: "reconcile",
  },
  {
    id: 7,
    accountantId: 6,
    accountantName: "Priya Shrestha",
    action: "Announcement sent",
    details: "Fee payment deadline reminder",
    timestamp: "Dec 16, 10:20 AM",
    type: "announcement",
  },
  {
    id: 8,
    accountantId: 1,
    accountantName: "Ram Prasad Bhattarai",
    action: "Payment collected",
    details: "Class 10 · Admission Fee · Rs. 8,000",
    timestamp: "Dec 16, 10:00 AM",
    type: "payment",
  },
  {
    id: 9,
    accountantId: 8,
    accountantName: "Kiran Gurung",
    action: "Fee waiver applied",
    details: "Class 5 · Aarav Shrestha · 25% discount",
    timestamp: "Dec 15, 4:15 PM",
    type: "fee",
  },
  {
    id: 10,
    accountantId: 2,
    accountantName: "Sita Kumari Sharma",
    action: "Overdue reminder",
    details: "12 pending fees · Total Rs. 45,000",
    timestamp: "Dec 15, 1:30 PM",
    type: "report",
  },
];

const ACTIVITY_TYPE_CONFIG: Record<
  ActivityItem["type"],
  { icon: typeof UserCheck; bg: string; text: string; border: string; dotColor: string }
> = {
  payment: {
    icon: DollarSign,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  fee: {
    icon: FileText,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  report: {
    icon: ClipboardCheck,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  invoice: {
    icon: FileText,
    bg: "bg-violet-100",
    text: "text-violet-700",
    border: "border-violet-200",
    dotColor: "bg-violet-500",
  },
  profile: {
    icon: Pencil,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dotColor: "bg-slate-500",
  },
  reconcile: {
    icon: CheckCircle2,
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    border: "border-cyan-200",
    dotColor: "bg-cyan-500",
  },
  announcement: {
    icon: Bell,
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    dotColor: "bg-rose-500",
  },
};

function formatRelativeTime(timestamp: string): string {
  if (timestamp.startsWith("Today")) return "Just now";
  if (timestamp.startsWith("Yesterday")) return "1d ago";
  const match = timestamp.match(/Dec (\d+)/);
  if (match) {
    const day = parseInt(match[1]);
    const now = new Date();
    const currentDay = now.getDate();
    const diff = currentDay - day;
    if (diff > 0) return `${diff}d ago`;
  }
  return timestamp;
}

export default function AccountantsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [newAccountantName, setNewAccountantName] = useState("");
  const [newAccountantPhone, setNewAccountantPhone] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<AccountantResponse | null>(
    null,
  );

  // Fetch accountants
  const {
    data: accountantsData,
    isLoading: accountantsLoading,
    isError: accountantsError,
    refetch: refetchAccountants,
  } = useQuery({
    queryKey: [
      "accountants",
      debouncedSearch,
      selectedDepartment,
      pageNum,
      pageSize,
    ],
    queryFn: async () => {
      const all = await getAllAccountants();
      all.sort((a, b) => a.accountantId - b.accountantId);
      const normalizedSearch = debouncedSearch.trim().toLowerCase();
      const filtered = normalizedSearch
        ? all.filter((a) =>
            a.accountantName.toLowerCase().includes(normalizedSearch),
          )
        : all;

      const startIndex = (pageNum - 1) * pageSize;
      const paged = filtered.slice(startIndex, startIndex + pageSize);

      return {
        content: paged,
        pageNum,
        pageSize,
        numOfElements: paged.length,
        totalElements: filtered.length,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: AccountantCreate) => createAccountant(payload),
    onSuccess: () => {
      setAddDialogOpen(false);
      setNewAccountantName("");
      setNewAccountantPhone("");
      refetchAccountants();
      toast({
        title: "Accountant added",
        description: "New accountant has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add accountant",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccountant(id),
    onSuccess: () => {
      setDeleteDialog(null);
      refetchAccountants();
      toast({
        title: "Accountant deleted",
        description: "The accountant has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete accountant",
        description: getApiErrorMessage(error, "Please try again later."),
        variant: "destructive",
      });
    },
  });

  const accountants = accountantsData?.content || [];
  const totalAccountants = accountantsData?.totalElements || 0;
  const hasContent = accountants.length > 0;

  const displayedActivities = showAllActivities
    ? MOCK_ACTIVITIES
    : MOCK_ACTIVITIES.slice(0, 5);

  const handleExport = () => {
    const data = accountants.map((a) => ({
      accountantId: a.accountantId,
      accountantName: a.accountantName,
      accountantPhoneNumber: a.accountantPhoneNumber,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accountants-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `${accountants.length} accountants exported successfully.`,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Accountants
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage school accountants and financial records
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Add Accountant
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-semibold">
            All Accountants
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
              {totalAccountants} total
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <DebouncedSearchInput
            value={debouncedSearch}
            placeholder="Search accountants..."
            onChange={(val) => {
              setDebouncedSearch(val);
              setPageNum(1);
            }}
            className="flex-1 sm:flex-initial sm:w-64"
            inputClassName="h-9"
          />
          <div className="flex border rounded-md overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 sm:p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 sm:p-2 transition-colors",
                viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {accountantsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground animate-spin" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading accountants...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {accountantsError && !accountantsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Failed to load accountants
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAccountants()}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{" "}
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Content or Empty State */}
      {!accountantsLoading && !accountantsError && (
        <>
          {hasContent ? (
            viewMode === "grid" ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {accountants.map((accountant, index) => {
                  const hasTransactions = accountant.editPermission;
                  const statusConfig = hasTransactions
                    ? STATUS_CONFIG.ACTIVE
                    : STATUS_CONFIG.INACTIVE;
                  const avatarColor =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const initials = accountant.accountantName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={accountant.accountantId}
                      className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                      onClick={() =>
                        router.push(`/admin/accountants/${accountant.accountantId}`)
                      }
                    >
                      <div className="p-3 sm:p-5">
                        {/* Top Section */}
                        <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0",
                              avatarColor.bg,
                              avatarColor.text,
                            )}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate">
                              {accountant.accountantName}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {accountant.accountantPhoneNumber}
                            </p>
                            <Badge
                              className={cn(
                                "mt-1.5 sm:mt-2 border text-[10px]",
                                statusConfig.bg,
                                statusConfig.text,
                                statusConfig.border,
                              )}
                            >
                              <statusConfig.icon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t mb-3 sm:mb-4" />

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center bg-muted/30 rounded-lg p-2.5 sm:p-3">
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-sm sm:text-base font-bold">
                              {hasTransactions ? "Active" : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Status
                            </p>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-sm sm:text-base font-bold">
                              {accountant.editPermission ? "Edit" : "View"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Access
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 sm:mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/admin/accountants/${accountant.accountantId}`,
                              );
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog(accountant);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Accountant
                        </th>
                        <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Phone
                        </th>
                        <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </th>
                        <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {accountants.map((accountant, index) => {
                        const hasTransactions = accountant.editPermission;
                        const statusConfig = hasTransactions
                          ? STATUS_CONFIG.ACTIVE
                          : STATUS_CONFIG.INACTIVE;
                        const avatarColor =
                          AVATAR_COLORS[index % AVATAR_COLORS.length];

                        return (
                          <tr
                            key={accountant.accountantId}
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/admin/accountants/${accountant.accountantId}`,
                              )
                            }
                          >
                            <td className="px-3 sm:px-5 py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                    avatarColor.bg,
                                    avatarColor.text,
                                  )}
                                >
                                  {accountant.accountantName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                    {accountant.accountantName}
                                  </p>
                                  <p className="sm:hidden text-[11px] text-muted-foreground">
                                    {accountant.accountantPhoneNumber}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-sm text-muted-foreground">
                              {accountant.accountantPhoneNumber}
                            </td>
                            <td className="px-3 sm:px-5 py-3 text-center">
                              <Badge
                                className={cn(
                                  "border text-[10px] px-2 py-0 h-5",
                                  statusConfig.bg,
                                  statusConfig.text,
                                  statusConfig.border,
                                )}
                              >
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-5 py-3 text-right">
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
                                      router.push(
                                        `/admin/accountants/${accountant.accountantId}`,
                                      );
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteDialog(accountant);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />{" "}
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
            )
          ) : (
            <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No accountants found</p>
              {(debouncedSearch || selectedDepartment !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => {
                    setDebouncedSearch("");
                    setSelectedDepartment("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Recent Activity — Desktop (timeline table) */}
      <div className="hidden sm:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Recent Activity</h2>
              <p className="text-xs text-muted-foreground">
                Latest financial actions from your accountants
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/admin/activities")}
          >
            View all <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Accountant
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedActivities.map((activity) => {
                const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type];
                const TypeIcon = typeConfig.icon;
                const avatarColor =
                  AVATAR_COLORS[activity.accountantId % AVATAR_COLORS.length];

                return (
                  <tr
                    key={activity.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() =>
                      router.push(
                        `/admin/accountants/${activity.accountantId}`,
                      )
                    }
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            avatarColor.bg,
                            avatarColor.text,
                          )}
                        >
                          {activity.accountantName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">
                          {activity.accountantName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                            typeConfig.bg,
                          )}
                        >
                          <TypeIcon
                            className={cn("h-3.5 w-3.5", typeConfig.text)}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {activity.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-[300px] truncate">
                      {activity.details}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!showAllActivities && MOCK_ACTIVITIES.length > 5 && (
          <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setShowAllActivities(true)}
            >
              Show {MOCK_ACTIVITIES.length - 5} more activities
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Recent Activity — Mobile (card timeline) */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] text-muted-foreground h-7 px-2"
            onClick={() => router.push("/admin/activities")}
          >
            View all
          </Button>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-0">
            {displayedActivities.map((activity, idx) => {
              const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type];
              const TypeIcon = typeConfig.icon;
              const avatarColor =
                AVATAR_COLORS[activity.accountantId % AVATAR_COLORS.length];
              const isLast =
                idx === displayedActivities.length - 1;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "relative flex gap-3 cursor-pointer",
                    !isLast ? "pb-4" : "pb-1",
                  )}
                  onClick={() =>
                    router.push(
                      `/admin/accountants/${activity.accountantId}`,
                    )
                  }
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 w-[31px] flex-shrink-0 flex items-start justify-center pt-0.5",
                    )}
                  >
                    <div
                      className={cn(
                        "w-[7px] h-[7px] rounded-full mt-[5px] ring-[3px] ring-white",
                        typeConfig.dotColor,
                      )}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 rounded-lg border bg-card p-3 shadow-sm active:scale-[0.99] transition-transform">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0",
                            avatarColor.bg,
                            avatarColor.text,
                          )}
                        >
                          {activity.accountantName.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold truncate">
                          {activity.accountantName}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                          typeConfig.bg,
                        )}
                      >
                        <TypeIcon
                          className={cn("h-3 w-3", typeConfig.text)}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {!showAllActivities && MOCK_ACTIVITIES.length > 5 && (
          <div className="flex items-center justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-muted-foreground hover:text-foreground h-8 gap-1"
              onClick={() => setShowAllActivities(true)}
            >
              Show {MOCK_ACTIVITIES.length - 5} more
            </Button>
          </div>
        )}
      </div>

      {/* Add Accountant Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Accountant
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Add a new accountant to the school.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">Accountant Information</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter accountant's full name"
                className="h-10 sm:h-11"
                value={newAccountantName}
                onChange={(event) => setNewAccountantName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                className="h-10 sm:h-11"
                value={newAccountantPhone}
                onChange={(event) => setNewAccountantPhone(event.target.value)}
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
                if (!newAccountantName.trim()) {
                  toast({
                    title: "Missing name",
                    description: "Accountant name is required.",
                  });
                  return;
                }
                if (!newAccountantPhone.trim()) {
                  toast({
                    title: "Missing phone",
                    description: "Accountant phone number is required.",
                  });
                  return;
                }
                createMutation.mutate({
                  accountantName: newAccountantName.trim(),
                  accountantPhoneNumber: newAccountantPhone.trim(),
                });
              }}
              disabled={createMutation.isPending}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {createMutation.isPending
                ? "Adding..."
                : "Add Accountant"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title="Delete Accountant?"
        description={
          <>
            This will permanently remove{" "}
            <strong>{deleteDialog?.accountantName}</strong> and all associated
            data. This action cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteDialog?.accountantId) {
            deleteMutation.mutate(deleteDialog.accountantId);
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
