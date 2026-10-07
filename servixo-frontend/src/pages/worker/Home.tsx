import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getWorkerProfile, toggleAvailability } from "../../services/workerService";
import { getNearbyJobs, getWorkerDashboardStats } from "../../services/jobService";
import { createQuotation, getMyQuotations } from "../../services/quotationService";
import { NotificationBell } from "../../components/NotificationBell";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LogoIcon } from "../../components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Briefcase,
  Home as HomeIcon,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  X,
  Send,
  Loader2,
  Edit3,
  Star,
  TrendingUp,
  FileText,
  Radio,
  Search,
  Lightbulb,
} from "lucide-react";

const getCategoryIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("plumb")) return <Droplets className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
  if (normalized.includes("electri")) return <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
  if (normalized.includes("clean")) return <HomeIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
  if (normalized.includes("paint")) return <Paintbrush className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
  if (normalized.includes("ac") || normalized.includes("repair")) return <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
  return <Briefcase className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
};

function calculateDistance(
  coords1?: [number, number],
  coords2?: [number, number]
): number | null {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) return null;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  if ((lon1 === 0 && lat1 === 0) || (lon2 === 0 && lat2 === 0)) {
    return null;
  }

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return past.toLocaleDateString();
}

export default function WorkerHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [newJobToast, setNewJobToast] = useState<{
    id: string;
    categoryName: string;
    description: string;
  } | null>(null);

  const [quoteSuccessToast, setQuoteSuccessToast] = useState<string | null>(null);
  const [acceptedJobIds, setAcceptedJobIds] = useState<Set<string>>(new Set());

  // Modal State for Send Quote
  const [selectedJobForQuote, setSelectedJobForQuote] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState<string>("");
  const [quoteMessage, setQuoteMessage] = useState<string>("");
  const [quoteEta, setQuoteEta] = useState<number>(30);

  // Fetch worker profile
  const { data: worker, isLoading: loadingProfile } = useQuery({
    queryKey: ["workerProfile", user?.id],
    queryFn: () => getWorkerProfile(user!.id),
    enabled: !!user?.id,
  });

  // Socket.IO real-time job events
  useEffect(() => {
    if (!socket) return;

    const handleNewJob = (newJob: any) => {
      if (worker?.location?.coordinates && newJob?.location?.coordinates) {
        const dist = calculateDistance(worker.location.coordinates, newJob.location.coordinates);
        const radius = worker?.serviceRadiusKm || 100;
        if (dist !== null && dist > radius) return;
      }

      queryClient.setQueryData(["nearbyJobs"], (oldJobs: any[] = []) => {
        if (oldJobs.some((j) => j._id === newJob._id)) return oldJobs;
        return [newJob, ...oldJobs];
      });

      setNewJobToast({
        id: newJob._id,
        categoryName: newJob.category?.name || "New Service Request",
        description: newJob.description,
      });

      setTimeout(() => setNewJobToast(null), 5000);
    };

    const handleNewNotification = (notification: any) => {
      if (notification?.type === "quote_accepted") {
        const targetJobId =
          typeof notification.job === "object"
            ? notification.job?._id || notification.job?.id
            : notification.job;

        if (targetJobId) {
          setAcceptedJobIds((prev) => new Set(prev).add(targetJobId));
          setQuoteSuccessToast(
            notification.message || "🎉 You've been hired! Customer accepted your quote."
          );

          setTimeout(() => setQuoteSuccessToast(null), 5000);

          setTimeout(() => {
            queryClient.setQueryData(["nearbyJobs"], (oldJobs: any[] = []) =>
              oldJobs.filter((j) => (j._id || j.id) !== targetJobId)
            );
            setAcceptedJobIds((prev) => {
              const next = new Set(prev);
              next.delete(targetJobId);
              return next;
            });
          }, 4500);
        }
      } else if (notification?.type === "review_received") {
        const newRating = notification?.averageRating;
        const newTotal = notification?.totalReviews;

        queryClient.setQueriesData({ queryKey: ["workerProfile"] }, (oldWorker: any) => {
          if (!oldWorker) return oldWorker;
          return {
            ...oldWorker,
            rating: typeof newRating === "number" ? newRating : oldWorker.rating,
            totalReviews: typeof newTotal === "number" ? newTotal : oldWorker.totalReviews,
          };
        });

        queryClient.setQueriesData({ queryKey: ["workerDashboardStats"] }, (oldStats: any) => {
          if (!oldStats) return oldStats;
          return {
            ...oldStats,
            averageRating: typeof newRating === "number" ? newRating : oldStats.averageRating,
          };
        });

        queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] });
        queryClient.invalidateQueries({ queryKey: ["workerReviews"] });

        setQuoteSuccessToast(
          notification.message || "⭐ You received a new customer rating & review!"
        );
        setTimeout(() => setQuoteSuccessToast(null), 5000);
      }
    };

    socket.on("new-job", handleNewJob);
    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-job", handleNewJob);
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, queryClient, worker]);

  // Fetch nearby jobs
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["nearbyJobs"],
    queryFn: getNearbyJobs,
    enabled: !!worker?.isAvailable && worker?.verificationStatus === "verified",
  });

  const filteredJobs = (jobs || []).filter((job: any) => {
    if (worker?.location?.coordinates && job?.location?.coordinates) {
      const dist = calculateDistance(worker.location.coordinates, job.location.coordinates);
      const radius = worker?.serviceRadiusKm || 100;
      if (dist !== null && dist > radius) return false;
    }
    return true;
  });

  // Fetch worker dashboard stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["workerDashboardStats"],
    queryFn: getWorkerDashboardStats,
  });

  // Fetch worker's submitted quotations
  const { data: myQuotations } = useQuery({
    queryKey: ["myQuotations"],
    queryFn: getMyQuotations,
    enabled: !!worker?.isAvailable && worker?.verificationStatus === "verified",
  });

  const quotedJobIds = new Set(
    (myQuotations || []).map((q: any) =>
      typeof q.job === "object" ? q.job._id : q.job
    )
  );

  // Toggle availability mutation
  const toggleMutation = useMutation({
    mutationFn: (newAvailable: boolean) =>
      toggleAvailability(user!.id, newAvailable, {
        lat: worker?.location?.coordinates[1] || 11.2448,
        lng: worker?.location?.coordinates[0] || 75.7721,
      }),
    onSuccess: (updatedWorker) => {
      queryClient.setQueryData(["workerProfile", user?.id], updatedWorker);
      queryClient.invalidateQueries({ queryKey: ["nearbyJobs"] });
    },
  });

  // Send Quote Mutation
  const sendQuoteMutation = useMutation({
    mutationFn: (payload: { jobId: string; price: number; message?: string; etaMinutes?: number }) =>
      createQuotation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myQuotations"] });
      setSelectedJobForQuote(null);
      setQuotePrice("");
      setQuoteMessage("");
      setQuoteEta(30);

      setQuoteSuccessToast("Your price quote has been submitted successfully!");
      setTimeout(() => setQuoteSuccessToast(null), 5000);
    },
  });

  const handleToggleAvailability = () => {
    if (!worker) return;
    toggleMutation.mutate(!worker.isAvailable);
  };

  const handleOpenQuoteModal = (job: any) => {
    setSelectedJobForQuote(job);
    setQuotePrice(worker?.visitingCharge ? String(worker.visitingCharge) : "");
    setQuoteMessage("");
    setQuoteEta(30);
  };

  const handleSendQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForQuote) return;
    const priceNum = Number(quotePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid positive quote price.");
      return;
    }

    sendQuoteMutation.mutate({
      jobId: selectedJobForQuote._id,
      price: priceNum,
      message: quoteMessage.trim() || undefined,
      etaMinutes: Number(quoteEta) || 30,
    });
  };

  const getStatusBadge = () => {
    if (!worker) return null;
    switch (worker.verificationStatus) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span> Verified Partner
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#070D0C] font-sans selection:bg-amber-500/20 overflow-x-hidden transition-colors duration-300">
      {/* Background Glow Spheres (Dark Mode subtle aura) */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Top Navigation Header */}
      <header className="bg-[#FAF9F5]/90 dark:bg-[#0E1A18]/80 backdrop-blur-xl border-b border-[#EBE6DA] dark:border-[#1A2E2A] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-9 h-9 rounded-xl shadow-md ring-1 ring-slate-900/5 dark:ring-white/10" />
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none block">
                Servixo
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block mt-0.5">
                Worker Portal
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 border-l border-slate-200 dark:border-[#1F3631] pl-6">
            <button
              onClick={() => navigate("/worker")}
              className="text-xs font-bold bg-slate-900 text-white dark:text-slate-950 dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-500 px-4 py-2 rounded-xl shadow-xs transition hover:opacity-90"
            >
              Available Requests
            </button>
            <button
              onClick={() => navigate("/worker/my-jobs")}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162724] px-4 py-2 rounded-xl transition"
            >
              My Hired Jobs
            </button>
            <button
              onClick={() => navigate("/worker/profile")}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162724] px-4 py-2 rounded-xl transition"
            >
              My Profile
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Dual Role Switcher */}
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
            className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#122320] hover:bg-slate-200 dark:hover:bg-[#192E2A] border border-slate-200 dark:border-[#1E3631] transition group shadow-xs"
            title="Edit Profile"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-gradient-to-tr dark:from-amber-400 dark:to-emerald-400 text-slate-800 dark:text-slate-950 font-extrabold text-xs flex items-center justify-center overflow-hidden shadow-xs">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "W"
              )}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {user?.name}
            </span>
          </button>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Real-time Job Notification Toast */}
      <AnimatePresence>
        {newJobToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 max-w-md w-full bg-slate-900 dark:bg-[#0E1B18] text-white p-4.5 rounded-2xl shadow-2xl border border-emerald-500/30 backdrop-blur-2xl flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                  Live Request Nearby
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Just now</span>
              </div>
              <h4 className="text-xs font-extrabold text-white truncate">{newJobToast.categoryName}</h4>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{newJobToast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {quoteSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 max-w-md w-full bg-emerald-900 dark:bg-[#0D211A] text-white p-4.5 rounded-2xl shadow-2xl border border-emerald-400/40 backdrop-blur-2xl flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-100">{quoteSuccessToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {loadingProfile ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-10 h-10 text-amber-500 dark:text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Card & Availability Switch */}
              <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden transition-colors duration-200">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-600 opacity-80" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] dark:bg-[#172B26] border border-[#EBE6DA] dark:border-[#23423B] text-slate-900 dark:text-amber-400 font-black text-xl flex items-center justify-center shadow-xs flex-shrink-0 overflow-hidden">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || "W"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] mb-6 transition-colors">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Account Status</span>
                  {getStatusBadge()}
                </div>

                {/* Online Availability Toggle */}
                <div className="pt-4 border-t border-[#F2ECE1] dark:border-[#1C322C] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Online Availability</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          worker?.isAvailable
                            ? "bg-emerald-500 dark:bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {worker?.isAvailable ? "Receiving live job requests nearby" : "Offline (Not receiving jobs)"}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleAvailability}
                    disabled={toggleMutation.isPending || worker?.verificationStatus !== "verified"}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                      worker?.isAvailable ? "bg-emerald-600 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-400" : "bg-slate-300 dark:bg-slate-800"
                    } ${worker?.verificationStatus !== "verified" ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                        worker?.isAvailable ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Profile Metrics Overview */}
              <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-colors duration-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Profile Metrics
                  </h3>
                  <button
                    onClick={() => navigate("/worker/profile")}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                      Avg Rating
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {worker?.rating?.toFixed(1) || "5.0"}
                      </span>
                      <span className="text-amber-500 text-xs font-bold">★</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        ({worker?.totalReviews || 0})
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                      Visiting Fee
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      ${worker?.visitingCharge || 0}
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                      Service Radius
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {worker?.serviceRadiusKm || 10} km
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                      Experience
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {worker?.experienceYears || 0} Yrs
                    </span>
                  </div>
                </div>

                {worker?.skills && worker.skills.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#F2ECE1] dark:border-[#1C322C]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2.5">
                      Active Skill Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-[#FAF9F5] dark:bg-[#172B26] text-slate-800 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-lg border border-[#EBE6DA] dark:border-[#23423B]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Main Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Performance Stats Overview Dashboard */}
              <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden transition-colors duration-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Performance Analytics
                  </h3>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                    Live Analytics
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Card 1 */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] hover:border-emerald-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Jobs Done</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {loadingStats ? "-" : stats?.totalJobsCompleted ?? 0}
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] hover:border-amber-400/40 transition-all duration-300">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Earned</span>
                      <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:bg-gradient-to-r dark:from-amber-200 dark:via-amber-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent truncate">
                      {loadingStats ? "-" : `$${(stats?.totalEarnings ?? 0).toLocaleString()}`}
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] hover:border-amber-400/40 transition-all duration-300">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
                      <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {loadingStats ? "-" : `${(stats?.averageRating ?? 0).toFixed(1)}`}
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] hover:border-emerald-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Quotes</span>
                      <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {loadingStats ? "-" : stats?.totalQuotesSent ?? 0}
                    </p>
                  </div>

                  {/* Card 5 */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630] hover:border-emerald-500/40 transition-all duration-300 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Acceptance</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {loadingStats ? "-" : `${stats?.acceptanceRate ?? 0}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feed Title */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                    Available Service Requests
                    {worker?.isAvailable && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live matching requests in your active skills within {worker?.serviceRadiusKm || 10} km
                  </p>
                </div>
              </div>

              {/* Feed Content */}
              {worker?.verificationStatus !== "verified" ? (
                <div className="bg-white dark:bg-[#0F1B18]/90 backdrop-blur-xl border border-slate-200/80 dark:border-[#1C322C] rounded-2xl p-10 text-center shadow-xs dark:shadow-2xl">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-500/20 shadow-inner">
                    <Clock className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                    Verification in Progress
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your worker account is under review by our administration team. Once verified, live service requests will automatically populate here.
                  </p>
                </div>
              ) : !worker?.isAvailable ? (
                <div className="bg-white dark:bg-[#0F1B18]/90 backdrop-blur-xl border border-slate-200/80 dark:border-[#1C322C] rounded-2xl p-10 text-center shadow-xs dark:shadow-2xl">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
                    <Radio className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">You are Currently Offline</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                    Toggle your online availability switch in the sidebar to start receiving and bidding on live job requests.
                  </p>
                  <button
                    onClick={handleToggleAvailability}
                    disabled={toggleMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-500 dark:hover:from-amber-300 dark:hover:to-amber-400 text-white dark:text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-md"
                  >
                    Go Online Now
                  </button>
                </div>
              ) : loadingJobs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-white dark:bg-[#0F1B18]/50 rounded-2xl border border-slate-200 dark:border-[#1C322C] animate-pulse"
                    />
                  ))}
                </div>
              ) : !filteredJobs || filteredJobs.length === 0 ? (
                <div className="space-y-6">
                  {/* Compact Empty State Radar Card */}
                  <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-2xl p-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-600 opacity-80" />

                    {/* Animated Radar Pulse Visual */}
                    <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                      <div className="absolute inset-2 rounded-full border border-amber-500/30 animate-pulse" />
                      <div className="w-16 h-16 rounded-2xl bg-[#FAF9F5] dark:bg-[#142420] border border-[#EBE6DA] dark:border-[#1E3630] flex items-center justify-center shadow-xs relative z-10 text-amber-600 dark:text-amber-400">
                        <Radio className="w-7 h-7 animate-pulse" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold mb-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live Radar Active
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                      Searching for Nearby Requests...
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-5 font-medium">
                      No customer service requests match your active skills within <span className="font-bold text-slate-900 dark:text-white">{worker?.serviceRadiusKm || 10} km</span> right now. Keep this portal open — new requests will appear here live!
                    </p>

                    <button
                      onClick={() => navigate("/worker/profile")}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Adjust Service Radius
                    </button>
                  </div>

                  {/* Pro Worker Tips & Guidance Card */}
                  <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between mb-4 border-b border-[#F2ECE1] dark:border-[#1C322C] pb-3">
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" /> Pro Tips to Win More Jobs
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Worker Guide
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 font-bold border border-amber-500/20">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                          Expand Radius
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          Increasing your radius by 5–10 km unlocks up to 3x more customer requests nearby.
                        </p>
                      </div>

                      <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 font-bold border border-emerald-500/20">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                          Fast Bidding
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          Quotes sent within 5 minutes of posting have a 78% higher acceptance rate.
                        </p>
                      </div>

                      <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#142420] rounded-xl border border-[#EBE6DA] dark:border-[#1E3630]">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 font-bold border border-blue-500/20">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                          Detailed Notes
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          Include clear arrival times & notes in quotes to build instant customer trust.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredJobs.map((job: any) => {
                      const distance =
                        worker.location && job.location
                          ? calculateDistance(
                              worker.location.coordinates,
                              job.location.coordinates
                            )
                          : null;

                      const isQuoted = quotedJobIds.has(job._id);
                      const isHired = acceptedJobIds.has(job._id);

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          key={job._id}
                          className={`bg-white dark:bg-[#0F1B18]/90 backdrop-blur-xl border rounded-2xl p-6 shadow-xs dark:shadow-xl transition-all duration-300 relative group dark:hover:border-amber-400/40 ${
                            isHired
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-[#0E261F]"
                              : "border-slate-200/80 dark:border-[#1C322C]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#162924] px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-[#213F38]">
                              {getCategoryIcon(job.category?.name || "")}
                              {job.category?.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-50 dark:bg-[#142420] px-3 py-1.5 rounded-xl border border-slate-100 dark:border-[#1E3630]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {timeAgo(job.createdAt)}
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Service Request</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed font-normal">
                            {job.description}
                          </p>

                          {job.images && job.images.length > 0 && (
                            <div className="flex gap-2.5 overflow-x-auto pb-3 mb-5 scrollbar-hide">
                              {job.images.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt="Job details"
                                  className="w-28 h-20 rounded-xl object-cover border border-slate-200 dark:border-[#1E3630] flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 dark:border-[#1C322C] flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {distance && (
                                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-[#162723] px-3 py-1.5 rounded-xl border border-amber-200 dark:border-[#213D37]">
                                  <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                  {distance} km away
                                </span>
                              )}
                              {job.address && (
                                <span className="text-slate-400 truncate max-w-[200px]">
                                  {job.address}
                                </span>
                              )}
                            </div>

                            {isHired ? (
                              <span className="inline-flex items-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md">
                                <Sparkles className="w-4 h-4 text-amber-300" /> Hired!
                              </span>
                            ) : isQuoted ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-xs font-bold px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Quote Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenQuoteModal(job)}
                                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-500 dark:hover:from-amber-300 dark:hover:to-amber-400 dark:text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
                              >
                                Send Quote <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quote Submission Modal */}
      <AnimatePresence>
        {selectedJobForQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0E1A18] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#1E3631] relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedJobForQuote(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182C28] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                    Submit Price Quote
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Send your proposed price & timeline directly to the customer
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#132320] rounded-xl p-4 mb-6 border border-slate-100 dark:border-[#1C322C]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-[#1A2E2A] px-2.5 py-1 rounded-lg border border-amber-200 dark:border-[#233F39]">
                    {selectedJobForQuote.category?.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {timeAgo(selectedJobForQuote.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {selectedJobForQuote.description}
                </p>
              </div>

              <form onSubmit={handleSendQuoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5 uppercase tracking-wider">
                    Quote Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="e.g. 150"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-white dark:bg-[#132320] border border-slate-300 dark:border-[#1E3631] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your standard visiting charge is ${worker?.visitingCharge || 0}.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5 uppercase tracking-wider">
                    Estimated Arrival Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={quoteEta}
                    onChange={(e) => setQuoteEta(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#132320] border border-slate-300 dark:border-[#1E3631] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5 uppercase tracking-wider">
                    Message / Note to Customer (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I have complete tools ready and can be at your location shortly."
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#132320] border border-slate-300 dark:border-[#1E3631] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none"
                  />
                </div>

                {sendQuoteMutation.isError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>
                      {(sendQuoteMutation.error as any)?.response?.data?.message ||
                        "Failed to submit quote."}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForQuote(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#1E3631] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162724] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendQuoteMutation.isPending}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-500 dark:hover:from-amber-300 dark:hover:to-amber-400 dark:text-slate-950 font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendQuoteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Quote
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
