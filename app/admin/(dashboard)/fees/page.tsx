"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  Banknote,
  RefreshCw,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/app/_components/ui/sheet";
import { cn } from "@/lib/utils";

// Mock Data Types
interface FeePayment {
  id: number;
  studentName: string;
  grade: string;
  section: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "ONLINE";
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  receiptNumber: string;
  academicYear: string;
}

interface FeeStats {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  previousMonthCollection: number;
  collectionTrend: number;
}

interface MonthlyCollection {
  month: string;
  collected: number;
  expected: number;
}

// Mock Data
const MOCK_ACADEMIC_YEARS = ["2080 B.S.", "2081 B.S.", "2082 B.S."];
const MOCK_GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const MOCK_SECTIONS = ["A", "B", "C", "D"];

const MOCK_RECENT_PAYMENTS: FeePayment[] = [
  {
    id: 1,
    studentName: "Aarav Sharma",
    grade: "10",
    section: "A",
    amount: 15000,
    paymentDate: "2026-06-05",
    paymentMethod: "ONLINE",
    status: "PAID",
    receiptNumber: "RCP-2026-001",
    academicYear: "2082 B.S.",
  },
  {
    id: 2,
    studentName: "Sita Devi",
    grade: "9",
    section: "B",
    amount: 12000,
    paymentDate: "2026-06-04",
    paymentMethod: "CASH",
    status: "PAID",
    receiptNumber: "RCP-2026-002",
    academicYear: "2082 B.S.",
  },
  {
    id: 3,
    studentName: "Ram Bahadur",
    grade: "8",
    section: "A",
    amount: 8000,
    paymentDate: "2026-06-03",
    paymentMethod: "BANK_TRANSFER",
    status: "PARTIAL",
    receiptNumber: "RCP-2026-003",
    academicYear: "2082 B.S.",
  },
  {
    id: 4,
    studentName: "Gita Kumari",
    grade: "10",
    section: "C",
    amount: 15000,
    paymentDate: "2026-06-02",
    paymentMethod: "ONLINE",
    status: "PENDING",
    receiptNumber: "RCP-2026-004",
    academicYear: "2082 B.S.",
  },
  {
    id: 5,
    studentName: "Hari Prasad",
    grade: "7",
    section: "B",
    amount: 10000,
    paymentDate: "2026-05-28",
    paymentMethod: "CASH",
    status: "OVERDUE",
    receiptNumber: "RCP-2026-005",
    academicYear: "2082 B.S.",
  },
  {
    id: 6,
    studentName: "Maya Devi",
    grade: "6",
    section: "A",
    amount: 9000,
    paymentDate: "2026-06-05",
    paymentMethod: "ONLINE",
    status: "PAID",
    receiptNumber: "RCP-2026-006",
    academicYear: "2082 B.S.",
  },
  {
    id: 7,
    studentName: "Krishna Bahadur",
    grade: "10",
    section: "B",
    amount: 15000,
    paymentDate: "2026-06-01",
    paymentMethod: "BANK_TRANSFER",
    status: "PAID",
    receiptNumber: "RCP-2026-007",
    academicYear: "2082 B.S.",
  },
  {
    id: 8,
    studentName: "Radha Kumari",
    grade: "9",
    section: "A",
    amount: 12000,
    paymentDate: "2026-05-30",
    paymentMethod: "CASH",
    status: "PARTIAL",
    receiptNumber: "RCP-2026-008",
    academicYear: "2082 B.S.",
  },
];

const MOCK_MONTHLY_COLLECTIONS: MonthlyCollection[] = [
  { month: "Jan", collected: 450000, expected: 520000 },
  { month: "Feb", collected: 480000, expected: 520000 },
  { month: "Mar", collected: 510000, expected: 550000 },
  { month: "Apr", collected: 490000, expected: 550000 },
  { month: "May", collected: 530000, expected: 580000 },
  { month: "Jun", collected: 520000, expected: 580000 },
];

const MOCK_STATS: FeeStats = {
  totalExpected: 580000,
  totalCollected: 520000,
  totalPending: 45000,
  totalOverdue: 15000,
  collectionRate: 89.7,
  previousMonthCollection: 530000,
  collectionTrend: -1.9,
};

// Status Config
const PAYMENT_STATUS_CONFIG = {
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  PARTIAL: {
    label: "Partial",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  PENDING: {
    label: "Pending",
    icon: AlertCircle,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  OVERDUE: {
    label: "Overdue",
    icon: X,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const PAYMENT_METHOD_CONFIG = {
  CASH: { label: "Cash", icon: Banknote, color: "text-green-600" },
  BANK_TRANSFER: { label: "Bank Transfer", icon: Building2, color: "text-blue-600" },
  ONLINE: { label: "Online", icon: CreditCard, color: "text-violet-600" },
};

export default function FeesPage() {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2082 B.S.");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const stats = MOCK_STATS;

  const activeFiltersCount = [
    selectedGrade !== "all" ? selectedGrade : "",
    selectedSection !== "all" ? selectedSection : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  const filteredPayments = useMemo(() => {
    return MOCK_RECENT_PAYMENTS.filter((payment) => {
      const matchesSearch =
        payment.studentName.toLowerCase().includes(search.toLowerCase()) ||
        payment.receiptNumber.toLowerCase().includes(search.toLowerCase());
      const matchesYear = payment.academicYear === selectedYear;
      const matchesGrade =
        selectedGrade === "all" || payment.grade === selectedGrade;
      const matchesSection =
        selectedSection === "all" || payment.section === selectedSection;
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      return (
        matchesSearch && matchesYear && matchesGrade && matchesSection && matchesStatus
      );
    });
  }, [search, selectedYear, selectedGrade, selectedSection, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setSelectedGrade("all");
    setSelectedSection("all");
    setStatusFilter("all");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const maxMonthlyValue = Math.max(
    ...MOCK_MONTHLY_COLLECTIONS.map((m) => Math.max(m.collected, m.expected))
  );

  // Mobile Filter Content
  const MobileFilterContent = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Academic Year
        </label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_ACADEMIC_YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Grade
        </label>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {MOCK_GRADES.map((grade) => (
              <SelectItem key={grade} value={grade}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Section
        </label>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {MOCK_SECTIONS.map((section) => (
              <SelectItem key={section} value={section}>
                Section {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Payment Status
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "PAID", label: "Paid" },
            { value: "PARTIAL", label: "Partial" },
            { value: "PENDING", label: "Pending" },
            { value: "OVERDUE", label: "Overdue" },
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                statusFilter === chip.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            clearFilters();
            setMobileFilterOpen(false);
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Track collections, payments, and outstanding fees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Record Payment</span>
            <span className="sm:hidden">Record</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Collected</p>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(stats.totalCollected)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className={cn(
              "flex items-center gap-0.5 font-semibold",
              stats.collectionTrend >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {stats.collectionTrend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(stats.collectionTrend)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Expected</p>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(stats.totalExpected)}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Total fees for {selectedYear}
          </p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Pending</p>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Overdue</p>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(stats.totalOverdue)}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Past due date
          </p>
        </div>
      </div>

      {/* Collection Rate Progress */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-bold">Collection Progress</h3>
          <span className="text-lg sm:text-xl font-black text-emerald-600">{stats.collectionRate}%</span>
        </div>
        <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
            style={{ width: `${stats.collectionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
          <span>{formatCurrency(stats.totalCollected)} collected</span>
          <span>{formatCurrency(stats.totalExpected)} expected</span>
        </div>
      </div>

      {/* Monthly Collection Chart */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold mb-4 sm:mb-6">Monthly Collection Trend</h3>
        <div className="space-y-3 sm:space-y-4">
          {MOCK_MONTHLY_COLLECTIONS.map((month) => (
            <div key={month.month} className="flex items-center gap-3 sm:gap-4">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 w-8 sm:w-10 flex-shrink-0">
                {month.month}
              </span>
              <div className="flex-1 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-5 sm:h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500/20 rounded-lg"
                      style={{ width: `${(month.expected / maxMonthlyValue) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500 rounded-lg"
                      style={{ width: `${(month.collected / maxMonthlyValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 w-16 sm:w-20 text-right flex-shrink-0">
                    {formatCurrency(month.collected)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-6 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            Collected
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/20" />
            Expected
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Desktop Filters */}
        <div className="hidden sm:flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student or receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_ACADEMIC_YEARS.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {MOCK_GRADES.map((grade) => (
                <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {MOCK_SECTIONS.map((section) => (
                <SelectItem key={section} value={section}>Section {section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Mobile Search + Filter */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm"
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
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 px-3 rounded-xl border-slate-200 gap-2 text-sm font-medium transition-all flex-shrink-0",
                  activeFiltersCount > 0
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center px-1.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
              <div className="px-5 py-4 border-b border-slate-100">
                <SheetHeader className="text-left space-y-0 p-0">
                  <SheetTitle className="text-lg font-bold text-slate-900">Filters</SheetTitle>
                </SheetHeader>
                <p className="text-xs text-slate-500 mt-0.5">Refine payment records</p>
              </div>
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
                <MobileFilterContent />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
                <Button
                  className="w-full h-11 rounded-xl text-sm font-semibold"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Show Results
                  {filteredPayments.length > 0 && (
                    <span className="ml-2 text-white/70">
                      ({filteredPayments.length})
                    </span>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold">Recent Payments</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-semibold">No payments found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Student
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Class
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Receipt
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Method
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayments.map((payment) => {
                    const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
                    const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod];
                    const StatusIcon = statusConfig.icon;
                    const MethodIcon = methodConfig.icon;

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{payment.studentName}</p>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          Grade {payment.grade} • {payment.section}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-slate-500">{payment.receiptNumber}</span>
                        </td>
                        <td className="px-5 py-3 text-center font-bold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-normal text-xs gap-1">
                            <MethodIcon className="h-3 w-3" />
                            {methodConfig.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge className={cn(
                            "border font-medium text-xs gap-1",
                            statusConfig.bg,
                            statusConfig.text,
                            statusConfig.border
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="sm:hidden divide-y">
              {filteredPayments.map((payment) => {
                const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
                const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod];
                const StatusIcon = statusConfig.icon;
                const MethodIcon = methodConfig.icon;

                return (
                  <div key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Grade {payment.grade} • Section {payment.section}
                        </p>
                      </div>
                      <Badge className={cn(
                        "border font-medium text-[10px] gap-1 flex-shrink-0 ml-2",
                        statusConfig.bg,
                        statusConfig.text,
                        statusConfig.border
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">{formatCurrency(payment.amount)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-normal text-[10px] gap-1">
                        <MethodIcon className="h-3 w-3" />
                        {methodConfig.label}
                      </Badge>
                      <span className="font-mono text-slate-400">{payment.receiptNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        {filteredPayments.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t bg-slate-50/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredPayments.length} of {MOCK_RECENT_PAYMENTS.length} payments
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                Previous
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}