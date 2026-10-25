import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Phone,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  UserCheck,
  UserX,
  Wrench,
  X,
} from "lucide-react";
import {
  getAdminUserDetails,
  type AdminUser,
  type AdminUserDetails,
} from "../../services/adminService";

interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
  onTriggerConfirm: (user: AdminUser, type: "block" | "unblock") => void;
  currentAdminId?: string;
  isActionBusy?: boolean;
}

const cardClass =
  "bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all duration-200 group";

function timeAgo(dateString?: string) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "on_the_way":
      return "On The Way";
    case "arrived":
      return "Arrived";
    case "working":
      return "Working";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "accepted":
      return "Accepted";
    case "pending":
      return "Pending";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40";
    case "working":
    case "in_progress":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40";
    case "on_the_way":
    case "arrived":
    case "accepted":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40";
    case "cancelled":
      return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40";
    default:
      return "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/40";
  }
}

export function UserDetailDrawer({
  userId,
  onClose,
  onTriggerConfirm,
  currentAdminId,
  isActionBusy = false,
}: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "worker" | "all">("all");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminUserDetails>({
    queryKey: ["adminUserDetail", userId],
    queryFn: () => getAdminUserDetails(userId!),
    enabled: !!userId,
  });

  // Sync default tab when user loads
  useEffect(() => {
    if (data) {
      if (data.customer && data.worker) {
        setActiveTab("all");
      } else if (data.worker) {
        setActiveTab("worker");
      } else {
        setActiveTab("customer");
      }
    }
  }, [data]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (userId) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [userId]);

  if (!userId) return null;

  const isSelf = data?.user._id === currentAdminId;
  const isAdminUser = data?.user.role === "admin";
  const hasBoth = !!(data?.customer && data?.worker);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#FBF9F4] dark:bg-[#0c1917] border-l border-[#EBE6DA] dark:border-gray-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-white dark:bg-[#132320] border-b border-[#EBE6DA] dark:border-gray-800 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent font-black text-xl flex items-center justify-center shrink-0 border border-accent/20">
                  {data?.user?.profilePhoto ? (
                    <img
                      src={data.user.profilePhoto}
                      alt={data.user.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    data?.user?.name?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-navy dark:text-white truncate">
                      {data?.user?.name || "User Details"}
                    </h2>
                    {data?.user?.role && (
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          data.user.role === "admin"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
                            : data.user.role === "worker"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
                        }`}
                      >
                        {data.user.role}
                      </span>
                    )}
                    {data?.user?.isBlocked ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {data?.user?.email}
                    </span>
                    {data?.user?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {data.user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {data && !isSelf && !isAdminUser && (
                  data.user.isBlocked ? (
                    <button
                      type="button"
                      disabled={isActionBusy}
                      onClick={() =>
                        onTriggerConfirm(
                          {
                            _id: data.user._id,
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role,
                            isBlocked: data.user.isBlocked,
                            createdAt: data.user.createdAt,
                          },
                          "unblock"
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs disabled:opacity-60"
                    >
                      {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Unblock</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isActionBusy}
                      onClick={() =>
                        onTriggerConfirm(
                          {
                            _id: data.user._id,
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role,
                            isBlocked: data.user.isBlocked,
                            createdAt: data.user.createdAt,
                          },
                          "block"
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs disabled:opacity-60"
                    >
                      {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Block</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-meta bar */}
            {data && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#EBE6DA]/60 dark:border-gray-800/60 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span>
                  Joined{" "}
                  <strong className="text-navy dark:text-gray-200">
                    {new Date(data.user.createdAt).toLocaleDateString()}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Email Status:
                  {data.user.isEmailVerified ? (
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Verified
                    </strong>
                  ) : (
                    <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                      Unverified
                    </strong>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                <p className="font-semibold text-sm">Loading user performance details…</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-5 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-red-700 dark:text-red-300">Failed to load details</h3>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    "Could not load details for this user."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loaded Data */}
            {!isLoading && !isError && data && (
              <>
                {/* Dual-role section switcher if user has both Customer and Worker data */}
                {hasBoth && (
                  <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                        activeTab === "all"
                          ? "bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white"
                      }`}
                    >
                      All Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("customer")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                        activeTab === "customer"
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Customer Section
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("worker")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                        activeTab === "worker"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white"
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Worker Section
                    </button>
                  </div>
                )}

                {/* 1. CUSTOMER SECTION */}
                {data.customer && (activeTab === "all" || activeTab === "customer") && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy dark:text-white text-base">
                          Customer Activity
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Job requests posted, platform spending, and reviews given
                        </p>
                      </div>
                    </div>

                    {/* Customer Stat Cards (Platform Overview Style) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Total Jobs Posted */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/40 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/40 uppercase tracking-wider">
                            Posted
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.customer.totalJobsPosted}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Total Jobs Posted
                        </p>
                      </div>

                      {/* Total Spent */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                            Paid
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${data.customer.totalSpent.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Total Spent (Completed & Paid)
                        </p>
                      </div>

                      {/* Unpaid Completed */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                            Unpaid
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${data.customer.unpaidCompleted.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Unpaid Completed ({data.customer.unpaidCompleted.count} jobs)
                        </p>
                      </div>

                      {/* Reviews Given */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200/80 dark:border-purple-800/40 group-hover:scale-110 transition-transform">
                            <Star className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/40 uppercase tracking-wider">
                            Feedback
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.customer.reviewsGiven}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Reviews Given to Workers
                        </p>
                      </div>
                    </div>

                    {/* Status Breakdown Box */}
                    <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-4">
                      <p className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-3">
                        Customer Jobs by Status
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {Object.entries(data.customer.countsByStatus).map(([status, count]) => (
                          <div
                            key={status}
                            className="bg-[#FBF9F4] dark:bg-[#0c1917] p-2.5 rounded-xl border border-[#EBE6DA]/60 dark:border-gray-800/60"
                          >
                            <p className="text-base font-bold text-navy dark:text-white">{count}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                              {formatStatus(status)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* 2. WORKER SECTION */}
                {data.worker && (activeTab === "all" || activeTab === "worker") && (
                  <section className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-navy dark:text-white text-base">
                            Worker Performance
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Professional verification, quotes, earnings, and ratings
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Worker Profile Meta Pills */}
                    <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">
                            Verification:
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                              data.worker.verificationStatus === "verified"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                                : data.worker.verificationStatus === "rejected"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                            }`}
                          >
                            {data.worker.verificationStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">
                            Availability:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              data.worker.isAvailable
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-400"
                            }`}
                          >
                            ● {data.worker.isAvailable ? "Available" : "Offline"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">
                            Radius:
                          </span>
                          <span className="text-navy dark:text-white font-bold">
                            {data.worker.serviceRadiusKm} km
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">
                            Experience:
                          </span>
                          <span className="text-navy dark:text-white font-bold">
                            {data.worker.experienceYears} yrs
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">
                            Visiting Fee:
                          </span>
                          <span className="text-navy dark:text-white font-bold">
                            ${data.worker.visitingCharge}
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      {data.worker.skills && data.worker.skills.length > 0 && (
                        <div className="pt-2 border-t border-[#EBE6DA]/60 dark:border-gray-800/60">
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                            Skills:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.worker.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FBF9F4] dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 text-navy dark:text-white"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Worker Stat Cards (Platform Overview Style) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Jobs Hired */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/40 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/40 uppercase tracking-wider">
                            Hired
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.worker.jobsHired}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Jobs Hired (Accepted & beyond)
                        </p>
                      </div>

                      {/* Completed Jobs */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                            Finished
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.worker.completedJobs}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Completed Jobs
                        </p>
                      </div>

                      {/* Total Earnings */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                            Earnings
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${data.worker.totalEarnings.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Total Worker Earnings (Paid)
                        </p>
                      </div>

                      {/* Pending Payout */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                            Pending
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${data.worker.pendingPayout.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Pending Payout (Completed, Unpaid)
                        </p>
                      </div>

                      {/* Platform Commission Generated */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200/80 dark:border-purple-800/40 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/40 uppercase tracking-wider">
                            15% Rev
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${data.worker.commissionGenerated.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Platform Commission Generated
                        </p>
                      </div>

                      {/* Quote Acceptance Rate */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center border border-indigo-200/80 dark:border-indigo-800/40 group-hover:scale-110 transition-transform">
                            <Percent className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/40 uppercase tracking-wider">
                            Quotes
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.worker.acceptanceRate}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          {data.worker.quotesAccepted} / {data.worker.quotesSent} Quotes Accepted
                        </p>
                      </div>

                      {/* Rating & Reviews */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                            <Star className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                            Reviews
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.worker.averageRating} ★
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Average Rating ({data.worker.totalReviews} reviews)
                        </p>
                      </div>

                      {/* Payment Issues Reported */}
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center border border-rose-200/80 dark:border-rose-800/40 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/40 uppercase tracking-wider">
                            Flagged
                          </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.worker.paymentIssuesReported}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">
                          Payment Issues Reported
                        </p>
                      </div>
                    </div>

                    {/* Worker Status Breakdown */}
                    <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-4">
                      <p className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-3">
                        Worker Jobs by Status
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {Object.entries(data.worker.countsByStatus).map(([status, count]) => (
                          <div
                            key={status}
                            className="bg-[#FBF9F4] dark:bg-[#0c1917] p-2.5 rounded-xl border border-[#EBE6DA]/60 dark:border-gray-800/60"
                          >
                            <p className="text-base font-bold text-navy dark:text-white">{count}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                              {formatStatus(status)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* 3. RECENT JOBS SECTION (last 10) */}
                <section className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-navy dark:text-white text-base">
                        Recent Jobs (Last 10)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Jobs involving this user as customer or worker
                      </p>
                    </div>
                  </div>

                  {data.recentJobs && data.recentJobs.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.recentJobs.map((job) => (
                        <div
                          key={job._id}
                          className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-navy dark:text-white text-sm truncate">
                                {job.category}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                                  job.status
                                )}`}
                              >
                                {formatStatus(job.status)}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-[#FBF9F4] dark:bg-[#0c1917] px-2 py-0.5 rounded-full border border-[#EBE6DA] dark:border-gray-800">
                                As {job.role}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              <span className="font-medium">
                                {job.role === "customer" ? "Worker:" : "Customer:"}
                              </span>{" "}
                              {job.otherPartyName}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {timeAgo(job.createdAt)} · {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-base font-bold text-navy dark:text-white">
                              {typeof job.price === "number" ? `$${job.price}` : "No price"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No jobs recorded for this user yet.
                    </div>
                  )}
                </section>

                {/* 4. RECENT REVIEWS SECTION (last 5) */}
                {data.worker && (
                  <section className="space-y-3 pt-2">
                    <div>
                      <h3 className="font-bold text-navy dark:text-white text-base">
                        Recent Reviews Received (Last 5)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Feedback and ratings submitted by customers
                      </p>
                    </div>

                    {data.recentReviews && data.recentReviews.length > 0 ? (
                      <div className="space-y-2.5">
                        {data.recentReviews.map((rev) => (
                          <div
                            key={rev._id}
                            className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                                <span>{rev.rating}</span>
                                <span>★</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                                  by {rev.customerName}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                {timeAgo(rev.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                              {rev.comment ? `"${rev.comment}"` : "No comment left"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No reviews received yet.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
