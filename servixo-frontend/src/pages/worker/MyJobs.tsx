import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkerAssignedJobs, startJob, completeJob, reportPaymentIssue } from "../../services/jobService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { NotificationBell } from "../../components/NotificationBell";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LogoIcon } from "../../components/Logo";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Droplets,
  Zap,
  Home as HomeIcon,
  Paintbrush,
  Wrench,
  Play,
  CheckCircle,
  Flag,
} from "lucide-react";

const getCategoryIcon = (name: string) => {
  const normalized = name ? name.toLowerCase() : "";
  if (normalized.includes("plumb")) return <Droplets className="w-5 h-5" />;
  if (normalized.includes("electri")) return <Zap className="w-5 h-5" />;
  if (normalized.includes("clean")) return <HomeIcon className="w-5 h-5" />;
  if (normalized.includes("paint")) return <Paintbrush className="w-5 h-5" />;
  if (normalized.includes("ac") || normalized.includes("repair")) return <Wrench className="w-5 h-5" />;
  return <Briefcase className="w-5 h-5" />;
};

export default function WorkerMyJobs() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: ["workerMyJobs"],
    queryFn: getWorkerAssignedJobs,
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      console.log("⚡ [Worker MyJobs Socket.IO] Notification received:", notification);

      if (notification?.type === "payment_confirmed") {
        const targetJobId =
          typeof notification.job === "object"
            ? notification.job?._id || notification.job?.id
            : notification.job;

        if (targetJobId) {
          console.log(`💵 [Worker MyJobs] Payment confirmed live for job ID: ${targetJobId}`);

          // Update query cache for workerMyJobs in place so status updates live
          queryClient.setQueryData(["workerMyJobs"], (oldJobs: any[] = []) => {
            return oldJobs.map((job: any) => {
              if ((job._id || job.id) === targetJobId) {
                return {
                  ...job,
                  isPaid: true,
                  status: "completed",
                };
              }
              return job;
            });
          });

          // Also invalidate stats query so earnings/completed stats update live
          queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] });
        }
      }
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, queryClient]);

  const startMutation = useMutation({
    mutationFn: (jobId: string) => startJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerMyJobs"] });
      queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (jobId: string) => completeJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerMyJobs"] });
      queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] });
    },
  });

  const reportPaymentMutation = useMutation({
    mutationFn: (jobId: string) => reportPaymentIssue(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerMyJobs"] });
    },
  });

  const getStatusBadge = (job: any) => {
    const status = job.status;
    const isPaid = job.isPaid;

    switch (status) {
      case "accepted":
        return (
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hired / Accepted
          </span>
        );
      case "in_progress":
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-amber-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> In Progress
          </span>
        );
      case "completed":
        if (isPaid) {
          return (
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-emerald-300 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Completed & Paid
            </span>
          );
        }
        return (
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Completed (Pending Payment)
          </span>
        );
      default:
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans selection:bg-accent/30 overflow-x-hidden transition-colors duration-300">
      {/* Header Bar */}
      <header className="bg-[#FAF9F5]/90 dark:bg-[#101F1C]/90 backdrop-blur-md border-b border-[#EBE6DA] dark:border-gray-800/80 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30 transition-colors duration-300">
        <div className="flex items-center gap-6">

          <div className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <h1 className="text-lg font-extrabold text-navy dark:text-white leading-none">Servixo</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-wider mt-0.5">
                Worker Portal
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 border-l border-gray-200 dark:border-gray-700/60 pl-6">
            <button
              onClick={() => navigate("/worker")}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white px-3 py-2 rounded-xl transition"
            >
              Available Requests
            </button>
            <button
              onClick={() => navigate("/worker/my-jobs")}
              className="text-xs font-bold bg-navy/5 dark:bg-accent/20 text-navy dark:text-accent px-3 py-2 rounded-xl transition"
            >
              My Hired Jobs
            </button>
            <button
              onClick={() => navigate("/worker/profile")}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white px-3 py-2 rounded-xl transition"
            >
              My Profile
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
            title="Switch to Customer Portal"
          >
            <HomeIcon className="w-3.5 h-3.5" /> Customer View
          </button>
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={() => navigate("/worker/profile")}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700/80 rounded-full px-3 py-1.5 transition-all text-left group"
            title="Edit Profile"
          >
            <div className="w-7 h-7 rounded-full bg-navy text-accent font-bold text-xs flex items-center justify-center shadow-sm overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "W"
              )}
            </div>
            <span className="text-xs font-bold text-navy hidden sm:inline group-hover:text-accent transition-colors">
              {user?.name}
            </span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-navy via-navy to-blue-950 py-10 px-6 overflow-hidden rounded-b-[2.5rem] shadow-xl">
        <div className="absolute top-0 right-0 w-[24rem] h-[24rem] bg-accent/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Assigned Work
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              My Hired Jobs & History
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-lg">
              Track active jobs you've been hired for and review past completed service requests.
            </p>
          </div>

          <button
            onClick={() => navigate("/worker")}
            className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Available Requests
          </button>
        </div>
      </div>

      {/* Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="bg-white dark:bg-[#132320] rounded-[2rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
            <p className="text-sm font-semibold text-navy dark:text-white">Loading your hired jobs...</p>
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-[#132320] rounded-[2rem] p-10 text-center border border-red-100 dark:border-red-900/40 shadow-sm">
            <h3 className="text-lg font-bold text-navy dark:text-white mb-2">Failed to load jobs</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">We encountered an issue fetching your hired jobs history.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-navy dark:bg-accent text-white dark:text-navy px-6 py-2.5 rounded-xl text-xs font-extrabold hover:bg-accent dark:hover:bg-amber-400 transition"
            >
              Try Again
            </button>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="bg-white/80 dark:bg-[#132320] border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-dashed border-2 max-w-xl mx-auto">
            <div className="w-20 h-20 bg-accent/10 dark:bg-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-accent/20 text-accent">
              <Briefcase className="w-10 h-10" />
            </div>
            <h4 className="text-navy dark:text-white font-extrabold text-xl mb-2">No hired jobs yet</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
              Jobs you've been hired for will show up here once a customer accepts your price quotation!
            </p>
            <button
              onClick={() => navigate("/worker")}
              className="bg-navy dark:bg-accent hover:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-accent dark:text-navy" />
              Find Available Requests
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Jobs Hired: {jobs.length}
              </span>
            </div>

            {jobs.map((job: any, index: number) => {
              const categoryName = job.category?.name || "Service Request";
              const customer = job.customer;
              const customerName = customer?.name || "Customer";
              const customerPhoto = customer?.profilePhoto;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={job._id}
                  className="bg-white dark:bg-[#132320] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  {/* Top Bar: Category & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="bg-navy/5 dark:bg-accent/15 text-navy dark:text-accent border border-navy/10 dark:border-accent/25 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-2">
                        {getCategoryIcon(categoryName)}
                        {categoryName}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(job.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {getStatusBadge(job)}
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-navy dark:text-white mb-2">Service Request Details</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-slate-50/50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                          {job.description}
                        </p>
                      </div>

                      {/* Customer Info Box */}
                      <div className="flex items-center gap-3 bg-white dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                        <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-gray-700 text-navy dark:text-accent font-bold text-sm flex items-center justify-center overflow-hidden border border-navy/10 dark:border-gray-600">
                          {customerPhoto ? (
                            <img src={customerPhoto} alt={customerName} className="w-full h-full object-cover" />
                          ) : (
                            customerName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-navy dark:text-white">{customerName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{customer?.phone || customer?.email || "Customer Contact"}</p>
                        </div>
                      </div>

                      {job.address && (
                        <div className="flex items-start gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{job.address}</span>
                        </div>
                      )}

                      {/* Images */}
                      {job.images && job.images.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pt-2">
                          {job.images.map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Job attachment"
                              className="w-24 h-20 rounded-2xl object-cover border border-gray-100 dark:border-gray-700 flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price & Agreed Details Box */}
                    <div className="bg-navy/5 dark:bg-gray-800/60 border border-navy/10 dark:border-gray-700/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
                          Agreed Price
                        </span>
                        <div className="text-2xl font-extrabold text-navy dark:text-white mt-1 flex items-baseline gap-1">
                          <span>₹{job.finalPrice || job.visitingCharge || "—"}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">total</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-navy/10 dark:border-gray-700 space-y-2">
                        {job.status === "accepted" && (
                          <button
                            onClick={() => startMutation.mutate(job._id)}
                            disabled={startMutation.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                          >
                            {startMutation.isPending && startMutation.variables === job._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Starting Job...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-white" /> Start Job
                              </>
                            )}
                          </button>
                        )}

                        {job.status === "in_progress" && (
                          <button
                            onClick={() => completeMutation.mutate(job._id)}
                            disabled={completeMutation.isPending}
                            className="w-full bg-accent hover:bg-blue-600 text-white font-extrabold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                          >
                            {completeMutation.isPending && completeMutation.variables === job._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Completing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" /> Mark as Completed
                              </>
                            )}
                          </button>
                        )}

                        {job.status === "completed" && (
                          <div className="text-center py-1">
                            {job.isPaid ? (
                              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Completed & Paid
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800 inline-block">
                                  Awaiting Customer Payment
                                </span>
                                {job.paymentIssueReported ? (
                                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-snug">
                                    Payment issue reported — customer notified
                                  </p>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => reportPaymentMutation.mutate(job._id)}
                                    disabled={reportPaymentMutation.isPending}
                                    className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white underline-offset-2 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {reportPaymentMutation.isPending && reportPaymentMutation.variables === job._id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" /> Reporting...
                                      </>
                                    ) : (
                                      <>
                                        <Flag className="w-3 h-3" /> Report Payment Not Received
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
