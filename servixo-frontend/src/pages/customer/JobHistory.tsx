import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyJobs } from "../../services/jobService";
import { markBadgesSeen } from "../../services/badgeService";
import { useBadgeSummary } from "../../hooks/useBadgeSummary";
import { Navbar } from "../../components/Navbar";
import { Badge } from "../../components/Badge";
import { Job, JobStatus } from "../../types";
import { formatJobCategory } from "../../utils/jobUtils";
import {
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Check,
  XCircle,
  AlertCircle,
  MapPin,
  Star,
  MessageSquare,
  DollarSign,
  Briefcase,
  ChevronRight,
  Droplets,
  Zap,
  Home as HomeIcon,
  Paintbrush,
  Wrench,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "all" | "active" | "completed" | "cancelled";

const ACTIVE_STATUSES: JobStatus[] = [
  "pending",
  "accepted",
  "in_progress",
  "on_the_way",
  "arrived",
  "working",
];

const STEPPER_STEPS = ["Posted", "Hired", "In progress", "Completed", "Paid"];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getStepperStep(job: Job): number {
  if (job.status === "cancelled") return 0;
  if (job.status === "pending") return 1;
  if (job.status === "accepted") return 2;
  if (ACTIVE_STATUSES.includes(job.status)) return 3;
  if (job.status === "completed") {
    return job.isPaid ? 5 : 4;
  }
  return 1;
}

function getCategoryIcon(categoryName: string) {
  const norm = categoryName.toLowerCase();
  if (norm.includes("plumb")) return <Droplets className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
  if (norm.includes("electri")) return <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
  if (norm.includes("clean")) return <HomeIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
  if (norm.includes("paint")) return <Paintbrush className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
  if (norm.includes("ac") || norm.includes("repair")) return <Wrench className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
  if (norm.includes("other")) return <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
  return <Briefcase className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
}

function getStatusPill(status: JobStatus, isPaid: boolean) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 uppercase tracking-wide">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Pending
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 uppercase tracking-wide">
          <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Hired
        </span>
      );
    case "in_progress":
    case "on_the_way":
    case "arrived":
    case "working":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          In Progress
        </span>
      );
    case "completed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
            isPaid
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
          }`}
        >
          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          {isPaid ? "Completed · Paid" : "Completed · Unpaid"}
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 uppercase tracking-wide">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 uppercase tracking-wide">
          {status}
        </span>
      );
  }
}

function ProgressStepper({ currentStep }: { currentStep: number }) {
  if (currentStep <= 0) return null;

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-200 dark:bg-gray-800 z-0" />
        {/* Active progress fill line */}
        <div
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-emerald-500 transition-all duration-500 z-0"
          style={{
            width: `${((Math.max(1, Math.min(5, currentStep)) - 1) / (STEPPER_STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPPER_STEPS.map((stepLabel, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div key={stepLabel} className="flex flex-col items-center relative z-10">
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-navy text-accent dark:bg-accent dark:text-navy ring-4 ring-navy/10 dark:ring-accent/20"
                    : "bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-gray-700"
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : stepNum}
              </div>
              <span
                className={`text-[9px] sm:text-[11px] font-semibold mt-1 tracking-tight text-center ${
                  isDone || isCurrent
                    ? "text-slate-900 dark:text-slate-200 font-bold"
                    : "text-slate-400 dark:text-gray-500"
                }`}
              >
                {stepLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JobHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: badgeSummary } = useBadgeSummary();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [unseenJobIds, setUnseenJobIds] = useState<Set<string>>(new Set());
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    if (!hasCapturedRef.current && badgeSummary?.bookingJobIds && badgeSummary.bookingJobIds.length > 0) {
      setUnseenJobIds(new Set(badgeSummary.bookingJobIds));
      hasCapturedRef.current = true;
    }
  }, [badgeSummary?.bookingJobIds]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await markBadgesSeen("bookings");
        queryClient.invalidateQueries({ queryKey: ["badgeSummary"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (err) {
        console.error("Failed to mark bookings badges as seen:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [queryClient]);

  const {
    data: jobs = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Job[]>({
    queryKey: ["my-jobs"],
    queryFn: getMyJobs,
  });

  const counts = useMemo(() => {
    return {
      all: jobs.length,
      active: jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length,
      completed: jobs.filter((j) => j.status === "completed").length,
      cancelled: jobs.filter((j) => j.status === "cancelled").length,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return ACTIVE_STATUSES.includes(job.status);
      if (activeTab === "completed") return job.status === "completed";
      if (activeTab === "cancelled") return job.status === "cancelled";
      return true;
    });
  }, [jobs, activeTab]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden font-sans relative transition-colors duration-300">
      <Navbar />

      {/* Hero Header Background */}
      <div className="absolute top-0 left-0 w-full h-[24vh] bg-gradient-to-br from-navy via-navy to-[#132823] dark:from-[#0B1513] dark:via-[#101F1C] dark:to-[#0B1513] z-0 overflow-hidden rounded-b-[2.5rem] shadow-lg">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[90px] translate-x-1/2 -translate-y-1/4 pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
        {/* Top bar with back and title */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white font-semibold transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Back</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/home/create-request")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New request</span>
          </motion.button>
        </div>

        {/* Main Content Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-[#132320]/95 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl border border-[#EBE6DA] dark:border-gray-800 p-4 sm:p-8 relative min-h-[55vh]"
        >
          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-gray-800/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white tracking-tight">
                My Bookings
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                Track active requests, review quotations, and view completed services.
              </p>
            </div>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-400 self-start sm:self-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-slate-100 dark:border-gray-800/60">
            {(
              [
                { id: "all", label: "All", count: counts.all },
                { id: "active", label: "Active", count: counts.active },
                { id: "completed", label: "Completed", count: counts.completed },
                { id: "cancelled", label: "Cancelled", count: counts.cancelled },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? "bg-navy text-white dark:bg-accent dark:text-navy shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162724]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-navy/20 dark:text-navy"
                        : "bg-slate-200/70 dark:bg-gray-800 text-slate-600 dark:text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skeleton Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800/40 border border-slate-200/80 dark:border-gray-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 animate-pulse"
                >
                  <div className="w-full sm:w-28 sm:h-28 h-36 bg-slate-200 dark:bg-gray-700/60 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="w-32 h-5 bg-slate-200 dark:bg-gray-700 rounded-md" />
                      <div className="w-20 h-5 bg-slate-200 dark:bg-gray-700 rounded-full" />
                    </div>
                    <div className="w-full h-3.5 bg-slate-200 dark:bg-gray-700/60 rounded" />
                    <div className="w-3/4 h-3.5 bg-slate-200 dark:bg-gray-700/60 rounded" />
                    <div className="w-48 h-3.5 bg-slate-200 dark:bg-gray-700/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State with Retry */}
          {isError && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white mb-2">
                Failed to load bookings
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                We encountered an issue fetching your service history. Please check your connection and try again.
              </p>
              <button
                onClick={() => refetch()}
                className="bg-navy hover:bg-accent dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy px-6 py-2.5 rounded-xl text-xs font-extrabold transition shadow-sm inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Empty State: Brand New Customer */}
          {!isLoading && !isError && jobs.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-accent/15 border border-amber-500/20 text-amber-600 dark:text-accent flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Briefcase className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-navy dark:text-white mb-2">
                No bookings yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                You haven't requested any services yet. Post your first request and get competitive quotations from verified local professionals.
              </p>
              <button
                onClick={() => navigate("/home/create-request")}
                className="bg-navy hover:bg-accent dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post a request
              </button>
            </div>
          )}

          {/* Empty State: Filter Tab Empty */}
          {!isLoading && !isError && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white mb-1.5 capitalize">
                No {activeTab} bookings
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                {activeTab === "active"
                  ? "You don't have any ongoing or pending requests right now."
                  : activeTab === "completed"
                  ? "Completed service bookings will appear here once the work is finished."
                  : "You don't have any cancelled service requests."}
              </p>
              {activeTab === "active" && (
                <button
                  onClick={() => navigate("/home/create-request")}
                  className="bg-navy hover:bg-accent dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy px-6 py-2.5 rounded-xl text-xs font-extrabold transition shadow-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post a request
                </button>
              )}
            </div>
          )}

          {/* Bookings List */}
          {!isLoading && !isError && filteredJobs.length > 0 && (
            <div className="space-y-4">
              {filteredJobs.map((job, index) => {
                const categoryName = formatJobCategory(job);
                const hasPhoto = job.images && job.images.length > 0;
                const photoUrl = hasPhoto ? job.images[0] : null;
                const stepperStep = getStepperStep(job);
                const isCancelled = job.status === "cancelled";
                const isPending = job.status === "pending";
                const quotesCount = job.quotesCount ?? 0;
                const lowestQuote = job.lowestQuote ?? null;
                const worker = job.worker;
                const workerUser = worker?.user;
                const workerName = workerUser?.name || "Assigned Worker";
                const workerPhoto = workerUser?.profilePhoto;
                const workerRating = typeof worker?.rating === "number" ? worker.rating : 0;
                const unreadMessagesCount = job.unreadMessages ?? 0;

                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => navigate(`/home/jobs/${job._id}`)}
                    className={`bg-white dark:bg-gray-800/80 hover:bg-slate-50/80 dark:hover:bg-gray-800 border rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden flex flex-col gap-4 ${
                      isCancelled
                        ? "opacity-80 border-slate-200 dark:border-gray-800"
                        : "border-slate-200/90 dark:border-gray-700/80 hover:border-accent/50"
                    }`}
                  >
                    {/* Top Row: Thumbnail + Details */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Left: Thumbnail or category icon fallback */}
                      <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200/70 dark:border-gray-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={categoryName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center shadow-xs">
                            {getCategoryIcon(categoryName)}
                          </div>
                        )}
                      </div>

                      {/* Middle: Title, pills, description, meta */}
                      <div className="flex-1 min-w-0 w-full">
                        {/* Title & Status Pill & Indicator Slot */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="font-extrabold text-navy dark:text-white text-base sm:text-lg truncate group-hover:text-accent transition-colors">
                              {categoryName}
                            </h3>
                            {/* Layout slot for small indicator if needed */}
                            {unseenJobIds.has(job._id) && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                title="Updated since last visit"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                New
                              </span>
                            )}
                          </div>
                          <div>{getStatusPill(job.status, job.isPaid)}</div>
                        </div>

                        {/* Description clamped to 2 lines */}
                        <p className="text-slate-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
                          {job.description}
                        </p>

                        {/* Meta row: Relative time + Address */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 dark:text-gray-400 font-medium">
                          <span
                            className="inline-flex items-center gap-1 cursor-help hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                            title={new Date(job.createdAt).toLocaleString(undefined, {
                              dateStyle: "full",
                              timeStyle: "short",
                            })}
                          >
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            {formatRelativeTime(job.createdAt)}
                          </span>

                          {job.address && (
                            <span
                              className="inline-flex items-center gap-1 truncate max-w-[280px]"
                              title={job.address}
                            >
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{job.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compact Stepper (Skipped for cancelled jobs) */}
                    {!isCancelled && (
                      <div className="pt-2 pb-1 border-t border-slate-100 dark:border-gray-800/80">
                        <ProgressStepper currentStep={stepperStep} />
                      </div>
                    )}

                    {/* State Info & Actions Footer */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-gray-800/80">
                      {/* Left: State summary (Quotes info or Worker details) */}
                      <div className="min-w-0">
                        {isPending && (
                          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-200 flex items-center gap-2">
                            {quotesCount > 0 ? (
                              <>
                                <span className="bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                  {quotesCount} {quotesCount === 1 ? "quote" : "quotes"}
                                </span>
                                {lowestQuote !== null && (
                                  <span className="text-slate-500 dark:text-gray-400 text-xs font-semibold">
                                    from <strong className="text-navy dark:text-white font-black">${lowestQuote}</strong>
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                Waiting for quotes
                              </span>
                            )}
                          </div>
                        )}

                        {!isPending && !isCancelled && worker && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy/10 dark:bg-white/10 text-navy dark:text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-gray-700">
                              {workerPhoto ? (
                                <img src={workerPhoto} alt={workerName} className="w-full h-full object-cover" />
                              ) : (
                                workerName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-none">
                                {workerName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {workerRating > 0 ? workerRating.toFixed(1) : "New"}
                                </span>
                                {job.finalPrice !== undefined && job.finalPrice !== null && (
                                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                                    ${job.finalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {isCancelled && (
                          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            This request was cancelled
                          </span>
                        )}
                      </div>

                      {/* Right: Primary and Secondary Action Buttons */}
                      <div className="flex items-center gap-2 sm:self-auto self-stretch">
                        {/* Secondary Message Button if worker assigned and not cancelled */}
                        {worker && !isCancelled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/home/messages?jobId=${job._id}`);
                            }}
                            className="flex-1 sm:flex-none text-xs font-bold text-slate-700 dark:text-gray-200 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3.5 py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-gray-700"
                            title="Chat with professional"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                            {unreadMessagesCount > 0 && (
                              <Badge count={unreadMessagesCount} size="sm" variant="rose" />
                            )}
                          </button>
                        )}

                        {/* ONE Primary Action by State */}
                        {(() => {
                          if (isPending) {
                            if (quotesCount > 0) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/home/jobs/${job._id}#quotations`);
                                  }}
                                  className="flex-1 sm:flex-none text-xs font-extrabold text-white bg-navy hover:bg-accent hover:text-navy dark:bg-accent dark:text-navy dark:hover:bg-amber-400 px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center justify-center gap-1.5"
                                >
                                  <span>View quotes ({quotesCount})</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/home/jobs/${job._id}`);
                                }}
                                className="flex-1 sm:flex-none text-xs font-extrabold text-navy dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition inline-flex items-center justify-center gap-1"
                              >
                                <span>View details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            );
                          }

                          if (ACTIVE_STATUSES.includes(job.status)) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/home/jobs/${job._id}`);
                                }}
                                className="flex-1 sm:flex-none text-xs font-extrabold text-white bg-navy hover:bg-accent hover:text-navy dark:bg-accent dark:text-navy dark:hover:bg-amber-400 px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center justify-center gap-1"
                              >
                                <span>View progress</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            );
                          }

                          if (job.status === "completed") {
                            if (!job.isPaid) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/home/jobs/${job._id}#payment`);
                                  }}
                                  className="flex-1 sm:flex-none text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center justify-center gap-1.5"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Confirm payment</span>
                                </button>
                              );
                            }

                            if (!job.review) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/home/jobs/${job._id}#review`);
                                  }}
                                  className="flex-1 sm:flex-none text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center justify-center gap-1.5"
                                >
                                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                                  <span>Rate professional</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/home/jobs/${job._id}#review`);
                                }}
                                className="flex-1 sm:flex-none text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-3.5 py-2 rounded-xl transition inline-flex items-center justify-center gap-1"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>You rated {job.review.rating} ★</span>
                              </button>
                            );
                          }

                          // Cancelled
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/home/jobs/${job._id}`);
                              }}
                              className="flex-1 sm:flex-none text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-xl transition"
                            >
                              Details
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
