import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../../services/categoryService";
import { getMyJobs, getCustomerDashboardStats } from "../../services/jobService";
import { Navbar } from "../../components/Navbar";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Calendar,
  Clock,
  ArrowRight,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Briefcase,
  Home as HomeIcon,
  Search as SearchIcon,
  MessageSquare,
  CheckCircle2,
  DollarSign
} from "lucide-react";

const getCategoryIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("plumb")) return <Droplets className="w-6 h-6" />;
  if (normalized.includes("electri")) return <Zap className="w-6 h-6" />;
  if (normalized.includes("clean")) return <HomeIcon className="w-6 h-6" />;
  if (normalized.includes("paint")) return <Paintbrush className="w-6 h-6" />;
  if (normalized.includes("ac") || normalized.includes("repair")) return <Wrench className="w-6 h-6" />;
  return <Briefcase className="w-6 h-6" />;
};

const getCategoryImage = (name: string) => {
  const normalized = name.toLowerCase();

  if (normalized.includes("plumb")) return "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("electri")) return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("clean")) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("paint")) return "https://images.unsplash.com/photo-1734475318787-b2b737296469?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHBhaW50ZXJ8ZW58MHx8MHx8fDA%3D";
  if (normalized.includes("ac")) return "https://plus.unsplash.com/premium_photo-1683134512538-7b390d0adc9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWMlMjByZXBhaXJ8ZW58MHx8MHx8fDA%3D";
  if (normalized.includes("appliance")) return "https://plus.unsplash.com/premium_photo-1661342406124-740ae7a0dd0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBwbGlhbmNlJTIwcmVwYWlyfGVufDB8fDB8fHww";
  if (normalized.includes("carpent")) return "https://images.unsplash.com/photo-1544164560-adac3045edb2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2FycGVudGVyfGVufDB8fDB8fHww";
  if (normalized.includes("repair")) return "https://plus.unsplash.com/premium_photo-1661342406124-740ae7a0dd0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBwbGlhbmNlJTIwcmVwYWlyfGVufDB8fDB8fHww";
  return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop";
};

export default function CustomerHome() {
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["myJobs"],
    queryFn: getMyJobs,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["customerDashboardStats"],
    queryFn: getCustomerDashboardStats,
  });

  const recentJob = jobs && jobs.length > 0 ? jobs[0] : null;

  const heroRef = useRef(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/services?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/services");
    }
  };

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden selection:bg-accent/30 font-sans transition-colors duration-300 relative">
      <div className="absolute inset-x-0 top-0 h-[85vh] bg-gradient-to-b from-[#F2ECE1]/70 via-[#FAF9F5]/90 to-[#FAF9F5] dark:from-transparent dark:to-transparent pointer-events-none -z-0" />
      <Navbar />

      <section ref={heroRef} className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh] flex items-center justify-center">

        <motion.div style={{ y: y1 }} className="absolute top-0 left-[-10%] w-96 h-96 bg-amber-400/15 dark:bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <motion.div style={{ y: y2 }} className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-500/10 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] hidden lg:flex items-center justify-center w-20 h-20 bg-white/90 dark:bg-gray-800/60 rounded-3xl shadow-[0_15px_35px_rgba(180,150,90,0.12)] border border-[#E5DEC9] dark:border-gray-700/80 backdrop-blur-xl z-0"
          style={{ y: y1 }}
        >
          <Wrench className="w-10 h-10 text-accent drop-shadow-md" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -15, 15, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-24 right-[12%] hidden lg:flex items-center justify-center w-24 h-24 bg-white/90 dark:bg-gray-800/60 rounded-[2rem] shadow-[0_15px_35px_rgba(40,30,10,0.08)] border border-[#E5DEC9] dark:border-gray-700/80 backdrop-blur-xl z-0"
          style={{ y: y2 }}
        >
          <Paintbrush className="w-12 h-12 text-blue-500 drop-shadow-md" />
        </motion.div>

        <motion.div
          style={{ opacity, scale }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-center max-w-4xl mx-auto relative z-10 mt-8"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-block py-1.5 px-5 rounded-full bg-white/90 dark:bg-gray-800/80 text-emerald-950 dark:text-amber-300 font-bold text-sm mb-6 border border-[#EBE6DA] dark:border-gray-700 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            Premium Service Marketplace
          </motion.span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
            Exceptional Services, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-700 to-blue-800 dark:from-accent dark:to-blue-400">
              Delivered to You.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Experience the finest local professionals. Fast, reliable, and just a click away. Book with confidence.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative max-w-2xl mx-auto group z-20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-blue-500/20 dark:from-accent/30 dark:to-blue-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60"></div>
            <div className="relative flex items-center bg-white dark:bg-[#142623]/90 backdrop-blur-2xl border border-[#E5DEC9] dark:border-gray-700/80 p-2.5 rounded-full shadow-[0_12px_45px_rgba(60,50,20,0.08)] transition-all duration-400 group-hover:shadow-[0_20px_60px_rgba(60,50,20,0.14)] group-hover:-translate-y-1">
              <div className="pl-6">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-emerald-700 dark:group-focus-within:text-accent transition-colors duration-300" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="block w-full pl-4 pr-4 py-4 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-medium placeholder-gray-400 sm:text-lg outline-none"
                placeholder="Search for a service..."
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy px-8 py-4 rounded-full text-base font-bold transition-all duration-300 shadow-md cursor-pointer"
              >
                Explore
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10">
        {/* Customer Overview Stats Dashboard Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Activity Overview
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">
                Summary stats of your bookings, active jobs, and total expenditure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Bookings
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.totalBookings ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Total Bookings</p>
            </motion.div>

            {/* Active Jobs / In Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
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
                  stats?.activeJobs ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Active Jobs</p>
            </motion.div>

            {/* Completed Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-emerald-950/40 text-blue-900 dark:text-emerald-400 flex items-center justify-center border border-blue-200/80 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-900 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-emerald-800/40 uppercase tracking-wider">
                  Done
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  stats?.completedJobs ?? 0
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Completed Jobs</p>
            </motion.div>

            {/* Total Spent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-[#132320]/90 backdrop-blur-xl border border-[#EBE6DA] dark:border-gray-800/80 rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-accent/20 text-emerald-900 dark:text-accent flex items-center justify-center border border-emerald-200/80 dark:border-accent/30 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-900 dark:text-accent bg-emerald-50 dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-accent/30 uppercase tracking-wider">
                  Spent
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {loadingStats ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
                ) : (
                  `$${(stats?.totalSpent ?? 0).toLocaleString()}`
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold mt-1">Total Spent</p>
            </motion.div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <div className="lg:col-span-2 space-y-16">

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Popular Services</h2>
                <button onClick={() => navigate("/services")} className="text-emerald-700 dark:text-accent hover:text-blue-700 dark:hover:text-blue-400 text-sm font-bold flex items-center gap-1.5 transition-colors group">
                  View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {loadingCats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-56 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-pulse rounded-3xl border border-white dark:border-gray-700"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6" style={{ perspective: 1200 }}>
                  {categories?.map((category: any, i: number) => (
                    <motion.button
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      whileHover={{ scale: 1.03, rotateX: 5, rotateY: -5, zIndex: 10 }}
                      transition={{
                        opacity: { delay: i * 0.1 },
                        y: { delay: i * 0.1 },
                        type: "spring", stiffness: 300, damping: 20
                      }}
                      key={category._id}
                      onClick={() => navigate("/home/create-request", { state: { categoryName: category.name } })}
                      className="relative h-56 rounded-[2rem] text-left overflow-hidden group shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-500 border border-[#EBE6DA] dark:border-gray-700/50 bg-white dark:bg-[#132320]"
                    >
                      <img
                        src={getCategoryImage(category.name)}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out z-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent dark:from-navy/95 dark:via-navy/40 dark:to-transparent z-10 transition-opacity duration-500 group-hover:opacity-80"></div>

                      <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                        <div className="w-12 h-12 mb-4 rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-emerald-700 dark:group-hover:bg-accent group-hover:border-emerald-700 dark:group-hover:border-accent group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500">
                          {getCategoryIcon(category.name)}
                        </div>
                        <h3 className="font-bold text-white text-xl tracking-wide group-hover:text-emerald-300 dark:group-hover:text-accent-light transition-colors">{category.name}</h3>
                        <p className="text-sm text-gray-200 dark:text-gray-300 mt-1.5 line-clamp-1 font-medium opacity-90 group-hover:opacity-100 transition-opacity">{category.description || 'Premium service'}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gradient-to-br dark:from-[#0D1E1B] dark:via-[#122B26] dark:to-[#0F352E] rounded-[2rem] p-8 text-slate-900 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 dark:group-hover:bg-accent/20 transition-colors duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

              <h3 className="text-xl font-extrabold mb-6 relative z-10">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <motion.button
                  onClick={() => navigate("/services")}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#F7F5EE] hover:bg-[#EFECE2] dark:bg-white/10 dark:hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border border-[#E5DEC9] dark:border-white/5 shadow-xs cursor-pointer"
                >
                  <SearchIcon className="w-6 h-6 text-emerald-700 dark:text-accent-light drop-shadow-sm" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Find Service</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/home/history")}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#F7F5EE] hover:bg-[#EFECE2] dark:bg-white/10 dark:hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border border-[#E5DEC9] dark:border-white/5 shadow-xs cursor-pointer"
                >
                  <Clock className="w-6 h-6 text-emerald-700 dark:text-accent-light drop-shadow-sm" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">History</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#F7F5EE] hover:bg-[#EFECE2] dark:bg-white/10 dark:hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border border-[#E5DEC9] dark:border-white/5 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-6 h-6 text-emerald-700 dark:text-accent-light drop-shadow-sm" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Messages</span>
                </motion.button>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#132320]/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#EBE6DA] dark:border-gray-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Recent Booking</h3>

              {loadingJobs ? (
                <div className="h-40 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-2xl border border-gray-200 dark:border-gray-700"></div>
              ) : recentJob ? (
                <div className="bg-[#FAF8F2] dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-[#EBE6DA] dark:border-gray-700/60 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-lg capitalize tracking-wide">
                      {recentJob.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm border border-gray-200/80 dark:border-gray-700">
                      {new Date(recentJob.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 text-lg">{recentJob.category?.name || 'Premium Service'}</h4>
                  {recentJob.worker ? (
                    <div className="flex items-center gap-3 mt-4 bg-white dark:bg-gray-800/80 p-2.5 rounded-xl border border-[#EBE6DA] dark:border-gray-700/60 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-100 dark:border-gray-700">
                        <img src={recentJob.worker.user.profilePhoto || "https://ui-avatars.com/api/?background=random&name=" + recentJob.worker.user.name} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-gray-200">{recentJob.worker.user.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 font-medium bg-white dark:bg-gray-800/80 p-3 rounded-xl border border-[#EBE6DA] dark:border-gray-700/60">Waiting for a professional to accept...</p>
                  )}
                  <button
                    onClick={() => navigate(`/home/jobs/${recentJob._id}`)}
                    className="w-full mt-5 bg-white dark:bg-gray-800 border-2 border-[#E5DEC9] dark:border-gray-700 text-slate-800 dark:text-white font-bold py-3 rounded-xl text-sm hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-accent hover:shadow-sm transition-all duration-300"
                  >
                    View Details
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-[#FAF8F2] dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-[#EBE6DA] dark:border-gray-700/60">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3 border border-[#EBE6DA] dark:border-gray-700">
                    <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-400" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-extrabold mb-1.5 text-lg">No recent bookings</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 font-medium">You haven't booked any premium services yet.</p>
                  <button
                    onClick={() => navigate("/home/create-request")}
                    className="text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:text-navy dark:hover:bg-amber-400 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-all duration-300 shadow-md"
                  >
                    Find a Service <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.section>

          </div>
        </div>
      </div>
    </div>
  );
}

