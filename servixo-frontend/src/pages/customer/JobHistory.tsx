import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyJobs } from "../../services/jobService";
import { Navbar } from "../../components/Navbar";
import { ChevronLeft, Calendar, CheckCircle, Clock, XCircle, AlertCircle, ChevronRight, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function JobHistory() {
  const navigate = useNavigate();

  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: getMyJobs,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide"><Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Pending</span>;
      case "accepted":
        return <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide"><CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Accepted</span>;
      case "in_progress":
        return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide"><span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> In Progress</span>;
      case "completed":
        return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide"><CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Completed</span>;
      case "cancelled":
        return <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide"><XCircle className="w-3 h-3 text-red-600 dark:text-red-400" /> Cancelled</span>;
      default:
        return <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max uppercase tracking-wide">{status}</span>;
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

  if (isError) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto pt-20 px-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">Error Loading History</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">We encountered an issue fetching your job history.</p>
          <button onClick={() => navigate("/home")} className="bg-navy text-white px-6 py-2 rounded-xl font-bold hover:bg-accent transition-colors">
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
          className="bg-white dark:bg-[#132320]/95 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl border border-[#EBE6DA] dark:border-gray-800 p-6 sm:p-10 relative overflow-hidden min-h-[50vh]"
        >

          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
            <div className="w-12 h-12 bg-navy/5 dark:bg-white/10 text-navy dark:text-white rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy dark:text-white">Service History</h1>
              <p className="text-gray-500 dark:text-gray-300 text-sm">View and track all your past and active requests.</p>
            </div>
          </div>

          {jobs && jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job: any, index: number) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/home/jobs/${job._id}`)}
                  className="bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-accent/40 p-5 rounded-2xl transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-4 mb-2">
                      <h3 className="font-bold text-navy dark:text-white text-lg">{job.category?.name || "Service"}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1 mb-3">{job.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="hidden sm:flex w-10 h-10 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-full items-center justify-center text-gray-400 dark:text-gray-300 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-navy dark:text-white mb-2">No jobs yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">You haven't requested any services yet.</p>
              <button onClick={() => navigate("/home/create-request")} className="bg-navy dark:bg-accent text-white dark:text-navy px-6 py-2.5 rounded-xl font-bold hover:bg-accent transition-colors shadow-sm">
                Request a Service
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
