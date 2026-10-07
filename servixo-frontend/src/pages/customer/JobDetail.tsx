import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobById, markJobPaid } from "../../services/jobService";
import { getJobQuotations, acceptQuotation } from "../../services/quotationService";
import { createReview, getJobReview } from "../../services/reviewService";
import { useSocket } from "../../context/SocketContext";
import { Navbar } from "../../components/Navbar";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Star,
  DollarSign,
  UserCheck,
  Loader2,
  Phone,
  MessageSquare,
  ShieldCheck,
  Send,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");


  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJobById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!socket || !id) return;

    const handleNewNotification = (notification: any) => {
      if (
        notification?.type === "quote_received" ||
        notification?.type === "job_started" ||
        notification?.type === "job_completed" ||
        notification?.type === "payment_confirmed" ||
        notification?.type === "payment_reminder"
      ) {
        const targetJobId =
          typeof notification.job === "object"
            ? notification.job?._id || notification.job?.id
            : notification.job;

        if (targetJobId === id) {
          console.log("⚡ [JobDetail Socket.IO] Live update for job:", id);
          queryClient.invalidateQueries({ queryKey: ["job", id] });
          queryClient.invalidateQueries({ queryKey: ["jobQuotations", id] });
          queryClient.invalidateQueries({ queryKey: ["customerDashboardStats"] });
        }
      }
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, id, queryClient]);

  const { data: quotations, isLoading: loadingQuotes } = useQuery({
    queryKey: ["jobQuotations", id],
    queryFn: () => getJobQuotations(id!),
    enabled: !!id,
  });

  const acceptedQuote = quotations?.find((q: any) => q.status === "accepted");
  const etaMinutes = acceptedQuote?.etaMinutes ?? 30;

  const sortedQuotations = quotations
    ? [...quotations].sort((a: any, b: any) => {
        const ratingA = a.worker?.rating ?? 0;
        const ratingB = b.worker?.rating ?? 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        const expA = a.worker?.experienceYears ?? 0;
        const expB = b.worker?.experienceYears ?? 0;
        return expB - expA;
      })
    : [];

  const acceptMutation = useMutation({
    mutationFn: (quotationId: string) => acceptQuotation(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobQuotations", id] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (jobId: string) => markJobPaid(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerDashboardStats"] });
    },
  });

  const { data: existingReview, isLoading: loadingReview } = useQuery({
    queryKey: ["jobReview", id],
    queryFn: () => getJobReview(id!),
    enabled: !!id && job?.status === "completed" && job?.isPaid,
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { jobId: string; rating: number; comment?: string }) =>
      createReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobReview", id] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] });
    },
  });


  const getStatusBadge = (jobObj: any) => {
    const status = jobObj?.status;
    const isPaid = jobObj?.isPaid;

    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "accepted":
        return (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <CheckCircle className="w-3 h-3" /> Accepted & Assigned
          </span>
        );
      case "in_progress":
        return (
          <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" /> In Progress
          </span>
        );
      case "completed":
        if (isPaid) {
          return (
            <span className="bg-emerald-100 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 w-max border border-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Completed & Paid
            </span>
          );
        }
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto pt-20 px-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We couldn't find the details for this job. It may have been deleted or you don't have
            permission to view it.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="bg-navy text-white px-6 py-2 rounded-xl font-bold hover:bg-accent transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden font-sans relative transition-colors duration-300">
      <Navbar />

      <div className="absolute top-0 left-0 w-full h-[22vh] bg-gradient-to-br from-navy via-navy to-[#132823] dark:from-[#0B1513] dark:via-[#101F1C] dark:to-[#0B1513] z-0 overflow-hidden rounded-b-[2rem] shadow-lg">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto pt-6 px-4 sm:px-6 pb-20 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white font-semibold mb-6 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-[#132320]/95 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl border border-[#EBE6DA] dark:border-gray-800 p-6 sm:p-10 relative overflow-hidden"
        >

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-navy dark:text-white mb-3">
                {job.category?.name || "Service Request"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
                {job.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent" /> {job.address}
                  </div>
                )}
              </div>
            </div>
            <div>{getStatusBadge(job)}</div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-navy dark:text-white mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.images && job.images.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                  Photos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {job.images.map((img: string, i: number) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <img
                        src={img}
                        alt={`Job reference ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Professional View when Job is Accepted */}
            {job.worker && (
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">
                  <span>Assigned Professional</span>
                  {job.finalPrice && (
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Agreed Price: ${job.finalPrice}
                    </span>
                  )}
                </h3>
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-gray-800/80 dark:to-gray-800/40 border border-slate-200 dark:border-gray-700/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-navy dark:bg-gray-700 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-md">
                      {job.worker.user?.profilePhoto ? (
                        <img
                          src={job.worker.user.profilePhoto}
                          alt={job.worker.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-accent font-extrabold text-2xl">
                          {job.worker.user?.name?.charAt(0) || "W"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-navy dark:text-white text-xl">
                        {job.worker.user?.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-300 font-semibold mt-0.5">
                        {job.worker.skills?.[0] || "Service Specialist"} • {job.worker.rating?.toFixed(1) || "5.0"} ★
                      </p>
                      {job.worker.user?.phone && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-navy dark:text-gray-200 mt-2">
                          <Phone className="w-3.5 h-3.5 text-accent" />
                          <span>{job.worker.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Professional Hired
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      Worker will arrive at your specified location.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* On The Way Status Banner when Job is In Progress */}
            {job.status === "in_progress" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-950/30 dark:to-emerald-950/30 border-2 border-amber-400/60 dark:border-amber-500/50 rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
                      <Truck className="w-7 h-7 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="relative flex h-3 w-3 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        <h4 className="text-xl font-extrabold text-navy dark:text-white tracking-tight">
                          Your professional is on the way!
                        </h4>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {job.worker?.user?.name || "The professional"} has started the job and is headed to your location.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-amber-300 dark:border-amber-700/60 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-sm flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400 block">
                        Estimated Arrival
                      </span>
                      <span className="text-lg font-black text-navy dark:text-white">
                        ~{etaMinutes} minutes
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Confirmation Section for Completed Job */}
            {job.status === "completed" && (
              <div className="pt-2">
                {!job.isPaid ? (
                  <div
                    className={`rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm ${
                      job.paymentIssueReported
                        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-700/70"
                        : "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60"
                    }`}
                  >
                    <div>
                      <h4
                        className={`font-extrabold text-base mb-1 flex items-center gap-2 ${
                          job.paymentIssueReported
                            ? "text-amber-950 dark:text-amber-200"
                            : "text-emerald-950 dark:text-emerald-200"
                        }`}
                      >
                        {job.paymentIssueReported ? (
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        Job Completed — Confirm Payment
                      </h4>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          job.paymentIssueReported
                            ? "text-amber-900 dark:text-amber-300"
                            : "text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        Your professional has marked this job as completed. Please confirm once you've paid them in person (Cash, UPI, or Direct Transfer).
                      </p>
                      {job.paymentIssueReported && (
                        <p className="mt-2 text-xs font-extrabold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/60 rounded-lg px-3 py-2">
                          Your professional has flagged this payment as pending — please confirm once paid.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => markPaidMutation.mutate(job._id)}
                      disabled={markPaidMutation.isPending}
                      className={`w-full sm:w-auto text-white font-extrabold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex-shrink-0 ${
                        job.paymentIssueReported
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {markPaidMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Confirm Payment Sent
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                          Completed & Paid
                          <span className="bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                          Payment has been confirmed by customer. Job is fully concluded!
                        </p>
                      </div>
                    </div>

                    {/* Rate & Review Section */}
                    {loadingReview ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                        <p className="text-xs text-gray-400 font-semibold">Loading review info...</p>
                      </div>
                    ) : existingReview ? (
                      <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4 className="font-extrabold text-navy dark:text-white text-base flex items-center gap-2">
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                            Your Submitted Review
                          </h4>
                          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 w-max">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= existingReview.rating
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-black text-amber-900 dark:text-amber-300">
                              {existingReview.rating}.0 / 5.0
                            </span>
                          </div>
                        </div>
                        {existingReview.comment ? (
                          <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-gray-700 dark:text-gray-200 font-medium italic mt-3">
                            "{existingReview.comment}"
                          </div>
                        ) : (
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-2">
                            You rated this job {existingReview.rating} out of 5 stars!
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800/90 border border-gray-200/90 dark:border-gray-700 rounded-2xl p-6 shadow-md">
                        <h4 className="font-extrabold text-navy dark:text-white text-lg mb-1 flex items-center gap-2">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          Rate & Review your Professional
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-5">
                          How satisfied were you with {job.worker?.user?.name || "the worker"}'s service? Your rating helps maintain trust on Servixo.
                        </p>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!ratingInput) return;
                            reviewMutation.mutate({
                              jobId: job._id,
                              rating: ratingInput,
                              comment: commentInput.trim() || undefined,
                            });
                          }}
                          className="space-y-5"
                        >
                          <div>
                            <label className="block text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider mb-2">
                              Your Rating <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingInput(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                                >
                                  <Star
                                    className={`w-8 h-8 ${
                                      star <= (hoverRating || ratingInput)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-3 text-sm font-extrabold text-navy dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                {hoverRating || ratingInput} / 5 Stars
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                              Review Comment (Optional)
                            </label>
                            <textarea
                              rows={3}
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              placeholder="Write a brief note about punctuality, quality of service, or overall experience..."
                              className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-navy dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                            />
                          </div>

                          {reviewMutation.isError && (
                            <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                              {(reviewMutation.error as any)?.response?.data?.message || "Failed to submit review."}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={reviewMutation.isPending}
                            className="bg-navy hover:bg-accent text-white hover:text-navy px-6 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                          >
                            {reviewMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting Review...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" /> Submit Review
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {job.status === "pending" && !job.worker && (
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                    Received Quotations
                    {quotations && quotations.length > 0 && (
                      <span className="bg-navy dark:bg-accent text-white dark:text-navy text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                        {quotations.length}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" /> Live Updates
                  </span>
                </div>

                {loadingQuotes ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-32 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700"
                      ></div>
                    ))}
                  </div>
                ) : !quotations || quotations.length === 0 ? (
                  <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-navy dark:text-white text-base mb-1">
                      Waiting for a professional to accept...
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                      Your service request has been broadcasted to nearby verified professionals. Offers
                      will appear here live as workers submit their price quotes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {sortedQuotations.map((q: any) => {
                        const workerUser = q.worker?.user || {};
                        const isSelected = q.status === "accepted";

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={q._id}
                            className="bg-gray-50/80 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:border-accent/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
                          >

                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 bg-navy dark:bg-gray-700 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm">
                                {workerUser.profilePhoto ? (
                                  <img
                                    src={workerUser.profilePhoto}
                                    alt={workerUser.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-accent font-extrabold text-xl">
                                    {workerUser.name?.charAt(0) || "W"}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-extrabold text-navy dark:text-white text-lg">
                                    {workerUser.name || "Worker Partner"}
                                  </h4>
                                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    {q.worker?.rating?.toFixed(1) || "5.0"}
                                  </span>
                                </div>

                                {q.worker?.skills && q.worker.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {q.worker.skills.map((skill: string, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="text-[10px] font-bold bg-white dark:bg-gray-700 text-navy dark:text-gray-200 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {q.message && (
                                  <div className="bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 font-medium flex items-start gap-2 mt-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                    <p className="line-clamp-2">{q.message}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:flex-col md:items-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-gray-700">
                              <div className="text-left md:text-right">
                                <div className="text-2xl font-extrabold text-navy dark:text-white flex items-center md:justify-end gap-0.5">
                                  <span className="text-sm font-bold text-gray-400 dark:text-gray-400">$</span>
                                  <span>{q.price}</span>
                                </div>
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-accent" />
                                  <span>ETA: {q.etaMinutes || 30} mins</span>
                                </div>
                              </div>

                              <button
                                onClick={() => acceptMutation.mutate(q._id)}
                                disabled={acceptMutation.isPending}
                                className="bg-navy hover:bg-accent dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy px-6 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                              >
                                {acceptMutation.isPending && acceptMutation.variables === q._id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Hiring...
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" /> Hire
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
