import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Menu, User, LogOut, Wrench, Briefcase, MessageSquare } from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";
import { Badge } from "./Badge";
import { useBadgeSummary } from "../hooks/useBadgeSummary";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: badgeSummary } = useBadgeSummary();

  const hasWorker = user?.hasWorkerProfile || user?.role === "worker";
  const isAdmin = user?.role === "admin";
  const homePath = isAdmin ? "/admin" : "/home";

  return (
    <nav className="bg-[#FAF9F5]/90 dark:bg-[#101F1C]/90 backdrop-blur-md border-b border-[#EBE6DA] dark:border-gray-800/80 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to={homePath} className="flex-shrink-0 flex items-center gap-2.5">
              <Logo className="w-9 h-9 sm:w-10 sm:h-10" />
              <span className="font-bold text-xl text-navy dark:text-white tracking-tight">Servixo</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {isAdmin ? (
                <Link to="/admin" className="text-sm font-medium text-navy dark:text-white hover:text-accent dark:hover:text-accent transition">Admin</Link>
              ) : (
                <>
                  <Link to="/home" className="text-sm font-medium text-navy dark:text-white hover:text-accent dark:hover:text-accent transition">Home</Link>
                  <Link to="/services" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white transition">Services</Link>
                  <Link to="/home/history" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white transition inline-flex items-center gap-1.5">
                    <span>My Bookings</span>
                    <Badge count={badgeSummary?.bookings} size="sm" />
                  </Link>
                  <Link to="/home/messages" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white transition inline-flex items-center gap-1.5">
                    <span>Messages</span>
                    <Badge count={badgeSummary?.messages} size="sm" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {!isAdmin && hasWorker && (
              <button
                type="button"
                onClick={() => navigate("/worker")}
                className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
                title="Switch to Worker Portal"
              >
                <Wrench className="w-3.5 h-3.5" /> Worker View
              </button>
            )}
            {!isAdmin && !hasWorker && (
              <button
                type="button"
                onClick={() => navigate("/become-worker")}
                className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
                title="Become a Service Professional"
              >
                <Briefcase className="w-3.5 h-3.5" /> Become a Worker
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/services")}
                className="p-2 text-gray-400 dark:text-gray-400 hover:text-navy dark:hover:text-white transition rounded-full hover:bg-[#F2EFE6] dark:hover:bg-gray-800/60 cursor-pointer"
                title="Search Services"
                aria-label="Search Services"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            {!isAdmin && <NotificationBell />}

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full border border-[#E5DEC9] dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 transition bg-white dark:bg-transparent shadow-xs"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <Menu className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#142623] rounded-xl shadow-xl border border-[#EBE6DA] dark:border-gray-700/80 py-1 origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-[#F2EFE6] dark:border-gray-700/50">
                    <p className="text-sm font-medium text-navy dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>

                  {/* Mobile Navigation Links (hidden on md and up) */}
                  <div className="md:hidden border-b border-[#F2EFE6] dark:border-gray-700/50 py-1">
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-navy dark:text-white hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                      >
                        Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/home"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-navy dark:text-white hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                        >
                          Home
                        </Link>
                        <Link
                          to="/services"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                        >
                          Services
                        </Link>
                        <Link
                          to="/home/history"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                        >
                          <span>My Bookings</span>
                          <Badge count={badgeSummary?.bookings} size="sm" />
                        </Link>
                        <Link
                          to="/home/messages"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>Messages</span>
                          </div>
                          <Badge count={badgeSummary?.messages} size="sm" />
                        </Link>
                      </>
                    )}
                  </div>

                  {!isAdmin && hasWorker && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/worker");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left transition font-semibold"
                    >
                      <Wrench className="w-4 h-4" /> Switch to Worker View
                    </button>
                  )}
                  {!isAdmin && !hasWorker && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/become-worker");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition font-semibold"
                    >
                      <Briefcase className="w-4 h-4" /> Become a Worker
                    </button>
                  )}

                  {!isAdmin && (
                    <Link
                      to="/home/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#FAF9F5] dark:hover:bg-gray-800/60 transition"
                    >
                      <User className="w-4 h-4" /> Account Profile
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

  );
}
