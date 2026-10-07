import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  getPaymentIssues,
  getPendingWorkers,
  getPlatformStats,
  rejectWorker,
  verifyWorker,
} from "../../services/adminService";

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

const cardClass =
  "bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 group";

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["adminPlatformStats"],
    queryFn: getPlatformStats,
  });

  const { data: workers, isLoading, isError, error } = useQuery({
    queryKey: ["pendingWorkers"],
    queryFn: getPendingWorkers,
  });

  const {
    data: paymentIssues,
    isLoading: loadingIssues,
    isError: issuesError,
    error: issuesErr,
  } = useQuery({
    queryKey: ["adminPaymentIssues"],
    queryFn: getPaymentIssues,
  });

  const verifyMutation = useMutation({
    mutationFn: verifyWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingWorkers"] });
      queryClient.invalidateQueries({ queryKey: ["adminPlatformStats"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingWorkers"] });
      queryClient.invalidateQueries({ queryKey: ["adminPlatformStats"] });
    },
  });

  const busyId =
    verifyMutation.isPending ? verifyMutation.variables : rejectMutation.isPending ? rejectMutation.variables : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F6] dark:bg-[#0B1513] transition-colors duration-300">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Admin panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Platform overview, unpaid job reports, and pending worker verification.
            </p>
          </div>
        </div>

        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform overview
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">
              Users, workers, and job counts across the marketplace.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Users
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.totalUsers ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Total Users</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-emerald-950/40 text-blue-900 dark:text-emerald-400 flex items-center justify-center border border-blue-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <UserRound className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-900 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Customers
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.totalCustomers ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Total Customers</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                  Workers
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.totalWorkers ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Total Workers</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-accent/20 text-emerald-900 dark:text-accent flex items-center justify-center border border-emerald-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-900 dark:text-accent bg-emerald-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-accent/30 uppercase tracking-wider">
                  Done
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.totalCompletedJobs ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Completed Jobs</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                  Pending
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.jobsByStatus.pending ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Pending Jobs</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-emerald-950/40 text-blue-900 dark:text-emerald-400 flex items-center justify-center border border-blue-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-900 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Accepted
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.jobsByStatus.accepted ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Accepted Jobs</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-accent/20 text-amber-900 dark:text-accent flex items-center justify-center border border-amber-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 dark:text-accent bg-amber-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-accent/30 uppercase tracking-wider">
                  In Progress
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.jobsByStatus.in_progress ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Jobs In Progress</p>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Completed
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.jobsByStatus.completed ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Jobs by Status: Completed</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-accent/15 text-amber-800 dark:text-accent flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy dark:text-white">Payment issues</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jobs where a worker reported not receiving payment. Visibility only — no resolution action yet.
              </p>
            </div>
          </div>

          {loadingIssues && (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading payment reports…
            </div>
          )}

          {issuesError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {(issuesErr as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Could not load payment issue reports."}
            </div>
          )}

          {!loadingIssues && !issuesError && (!paymentIssues || paymentIssues.length === 0) && (
            <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl px-6 py-16 text-center">
              <p className="text-navy dark:text-white font-medium">No payment issues reported</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Flagged unpaid jobs will appear here for review.
              </p>
            </div>
          )}

          {paymentIssues && paymentIssues.length > 0 && (
            <div className="space-y-4">
              {paymentIssues.map((job) => (
                <div
                  key={job._id}
                  className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy dark:text-white truncate">
                      {job.category?.name || "Uncategorized"} ·{" "}
                      {typeof job.finalPrice === "number" ? `$${job.finalPrice.toLocaleString()}` : "No price"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      <span className="font-medium">Customer:</span> {job.customer?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Worker:</span> {job.worker?.user?.name || "Unknown"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-accent shrink-0">
                    Reported {timeAgo(job.paymentIssueReportedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">Worker verification</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review pending worker applications and approve or reject them.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading pending workers…
          </div>
        )}

        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Could not load pending workers."}
          </div>
        )}

        {!isLoading && !isError && (!workers || workers.length === 0) && (
          <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl px-6 py-16 text-center">
            <p className="text-navy dark:text-white font-medium">No pending workers</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              New applications will show up here for review.
            </p>
          </div>
        )}

        {workers && workers.length > 0 && (
          <div className="space-y-4">
            {workers.map((worker) => (
              <div
                key={worker._id}
                className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy dark:text-white truncate">
                    {worker.user?.name || "Unknown worker"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {worker.user?.email || "No email"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <span className="font-medium">Skills:</span>{" "}
                    {worker.skills?.length ? worker.skills.join(", ") : "None listed"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Experience:</span> {worker.experienceYears ?? 0} years
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === worker._id}
                    onClick={() => verifyMutation.mutate(worker._id)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    {verifyMutation.isPending && verifyMutation.variables === worker._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === worker._id}
                    onClick={() => rejectMutation.mutate(worker._id)}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    {rejectMutation.isPending && rejectMutation.variables === worker._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
