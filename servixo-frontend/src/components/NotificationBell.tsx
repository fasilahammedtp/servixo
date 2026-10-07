import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../services/notificationService";
import { AppNotification } from "../types";
import { Bell, Briefcase, DollarSign, CheckCircle2, Clock, Star, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadNotificationCount"],
    queryFn: getUnreadCount,
    enabled: !!token,
    refetchInterval: 30000, // Fallback refetch every 30s
  });

  // Fetch full notifications list when dropdown is opened or on load
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!token,
  });

  // Mark notification read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (updatedNotif) => {
      queryClient.setQueryData<AppNotification[]>(["notifications"], (old = []) =>
        old.map((n) => (n._id === updatedNotif._id ? updatedNotif : n))
      );
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  // Mark all notifications read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Automatically mark visible unread notifications as read after 1.5 seconds of opening dropdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && unreadCount > 0 && !markAllReadMutation.isPending) {
      timer = setTimeout(() => {
        markAllReadMutation.mutate();
      }, 1500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, unreadCount]);


  // Socket.IO real-time listener for "new-notification"
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif: AppNotification) => {
      console.log("⚡ [Socket.IO] New real-time notification received:", newNotif);

      // Invalidate queries so count and dropdown list update automatically
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, queryClient]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    setIsOpen(false);

    if (notification.job) {
      const jobIdStr = typeof notification.job === "object" ? (notification.job as any)._id : notification.job;
      if (user?.role === "customer") {
        navigate(`/home/jobs/${jobIdStr}`);
      } else if (user?.role === "worker") {
        navigate("/worker");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job_matched":
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "quote_received":
        return <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "quote_accepted":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "job_started":
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "job_completed":
      case "payment_confirmed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "payment_reminder":
        return <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "review_received":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-navy dark:text-amber-300" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-navy dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/60 relative focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-extrabold text-[10px] rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#142623] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/80 py-2 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-navy dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-gray-400 font-medium">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-navy dark:text-gray-200">No notifications yet</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">
                    We'll inform you here when there are updates on your requests.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors flex items-start gap-3 ${
                      !notif.isRead ? "bg-blue-50/40 dark:bg-emerald-950/30" : "bg-white dark:bg-transparent"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        !notif.isRead
                          ? "bg-white dark:bg-gray-800 border-blue-200 dark:border-emerald-700/50 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/40"
                      }`}
                    >
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-xs leading-snug truncate ${
                            !notif.isRead ? "font-bold text-navy dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {notif.message}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-accent flex-shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
