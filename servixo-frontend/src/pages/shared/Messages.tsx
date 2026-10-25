import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getJobMessages,
  sendMessage,
  markJobMessagesAsRead,
} from "../../services/messageService";
import { getJobById } from "../../services/jobService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ChatMessage, Conversation } from "../../types";
import { Navbar } from "../../components/Navbar";
import { Logo } from "../../components/Logo";
import { NotificationBell } from "../../components/NotificationBell";
import { Badge } from "../../components/Badge";
import { useBadgeSummary } from "../../hooks/useBadgeSummary";
import { MessagesUnreadBadge } from "../../components/MessagesUnreadBadge";
import { formatJobCategory } from "../../utils/jobUtils";
import {
  Send,
  Loader2,
  ChevronLeft,
  MessageSquare,
  Search,
  ExternalLink,
  Clock,
  CheckCheck,
  AlertCircle,
  Home as HomeIcon,
  LogOut,
  Sparkles,
} from "lucide-react";

interface MessagesPageProps {
  portal?: "customer" | "worker";
}

export default function Messages({ portal }: MessagesPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { data: badgeSummary } = useBadgeSummary();

  const isWorkerPortal = portal === "worker" || user?.role === "worker";

  const paramJobId = searchParams.get("jobId") || "";
  const [selectedJobId, setSelectedJobId] = useState<string>(paramJobId);
  const [searchFilter, setSearchFilter] = useState("");

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMoreEarlier, setHasMoreEarlier] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMarkedJobIdRef = useRef<string | null>(null);

  // Sync paramJobId with selectedJobId
  useEffect(() => {
    if (paramJobId && paramJobId !== selectedJobId) {
      setSelectedJobId(paramJobId);
    }
  }, [paramJobId]);

  // Fetch all conversations
  const {
    data: rawConversations,
    isLoading: loadingConversations,
    isError: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 30000,
    retry: 1,
  });
  const conversations = rawConversations || [];

  // If navigated with jobId that has no messages yet, fetch job directly
  const isExistingInList = conversations.some((c) => c.jobId === selectedJobId);
  const { data: directJob } = useQuery({
    queryKey: ["directJobForChat", selectedJobId],
    queryFn: () => getJobById(selectedJobId),
    enabled: !!selectedJobId && !isExistingInList,
    retry: 1,
  });

  // Determine active conversation metadata
  let activeConversation: Conversation | null =
    conversations.find((c) => c.jobId === selectedJobId) || null;

  if (!activeConversation && directJob && directJob._id === selectedJobId) {
    const isCustomerCaller = directJob.customer === user?.id || directJob.customer?._id === user?.id;
    const otherUser = isCustomerCaller ? directJob.worker?.user : directJob.customer;

    activeConversation = {
      jobId: directJob._id,
      category: formatJobCategory(directJob),
      otherParty: {
        _id: otherUser?._id || otherUser?.id,
        name: otherUser?.name || "Service Professional",
        profilePhoto: otherUser?.profilePhoto,
      },
      otherPartyName: otherUser?.name || "Service Professional",
      otherPartyProfilePhoto: otherUser?.profilePhoto,
      lastMessage: { text: "", time: directJob.createdAt },
      lastMessageText: "",
      lastMessageTime: directJob.createdAt,
      unreadCount: 0,
    };
  }

  // Fetch initial messages for active job
  const {
    data: initialMessages,
    isLoading: loadingMessages,
    isError: messagesError,
    error: messagesErrorObj,
  } = useQuery({
    queryKey: ["jobMessages", selectedJobId],
    queryFn: () => getJobMessages(selectedJobId),
    enabled: !!selectedJobId,
    retry: 1,
  });

  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
      setHasMoreEarlier(initialMessages.length >= 50);
    }
  }, [initialMessages]);

  // Scroll to bottom on initial load or new message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Mark messages as read when viewing conversation and tab is visible
  useEffect(() => {
    if (!selectedJobId) return;

    function markReadIfVisible() {
      if (document.visibilityState === "visible" && selectedJobId && lastMarkedJobIdRef.current !== selectedJobId) {
        lastMarkedJobIdRef.current = selectedJobId;
        markJobMessagesAsRead(selectedJobId)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["messagesUnreadCount"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["badgeSummary"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          })
          .catch(() => {});
      }
    }

    markReadIfVisible();
    document.addEventListener("visibilitychange", markReadIfVisible);

    return () => {
      document.removeEventListener("visibilitychange", markReadIfVisible);
    };
  }, [selectedJobId]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ["messagesUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      if (newMsg.job === selectedJobId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        if (document.visibilityState === "visible") {
          markJobMessagesAsRead(selectedJobId).catch(() => {});
        }
      }
    };

    const handleMessagesRead = (payload: { jobId: string }) => {
      if (payload.jobId === selectedJobId) {
        const now = new Date().toISOString();
        setMessages((prev) =>
          prev.map((m) => {
            const senderId = typeof m.sender === "object" ? m.sender._id : m.sender;
            if (senderId === user?.id && !m.readAt) {
              return { ...m, readAt: now };
            }
            return m;
          })
        );
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socket, selectedJobId, user?.id, queryClient]);

  // Load earlier messages pagination
  async function handleLoadEarlier() {
    if (!selectedJobId || messages.length === 0 || loadingEarlier) return;
    const oldestMessage = messages[0];

    try {
      setLoadingEarlier(true);
      const older = await getJobMessages(selectedJobId, oldestMessage.createdAt);
      if (older.length < 50) {
        setHasMoreEarlier(false);
      }
      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const uniqueOlder = older.filter((m) => !existingIds.has(m._id));
          return [...uniqueOlder, ...prev];
        });
      } else {
        setHasMoreEarlier(false);
      }
    } catch (err) {
      console.error("Failed to load earlier messages:", err);
    } finally {
      setLoadingEarlier(false);
    }
  }

  // Send message with optimistic update & rollback
  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || !selectedJobId || isSending || trimmed.length > 1000) return;

    setSendError(null);
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      job: selectedJobId,
      sender: user!.id,
      recipient: activeConversation?.otherParty?._id || "",
      text: trimmed,
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");

    try {
      const created = await sendMessage(selectedJobId, trimmed);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? created : m)));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messagesUnreadCount"] });
    } catch (err: any) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInputText(trimmed);

      const status = err?.response?.status;
      if (status === 400 || status === 403 || status === 404) {
        setSendError(
          err?.response?.data?.message ||
            "This conversation is currently closed. Messaging is available only for active jobs."
        );
      } else {
        setSendError(err?.response?.data?.message || "Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      c.otherPartyName.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      (c.lastMessageText || "").toLowerCase().includes(term)
    );
  });

  // Identify last read message sent by me
  const mySentMessages = messages.filter((m) => {
    const senderId = typeof m.sender === "object" ? m.sender._id : m.sender;
    return senderId === user?.id;
  });
  const lastReadMessageId = mySentMessages.filter((m) => m.readAt !== null).slice(-1)[0]?._id;

  // Format timestamp helper
  function formatTime(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
      now.getDate() === date.getDate() &&
      now.getMonth() === date.getMonth() &&
      now.getFullYear() === date.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans selection:bg-accent/30 flex flex-col transition-colors duration-300">
      {/* Portal Navbar Header */}
      {isWorkerPortal ? (
        <header className="bg-[#FAF9F5]/90 dark:bg-[#101F1C]/90 backdrop-blur-md border-b border-[#EBE6DA] dark:border-gray-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => navigate("/worker")}>
              <Logo className="w-9 h-9 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-navy dark:text-white leading-none">
                  Servixo
                </h1>
                <p className="text-[10px] text-accent font-bold uppercase tracking-wider mt-0.5">
                  Worker Portal
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2 border-l border-gray-200 dark:border-gray-700/60 pl-6">
              <button
                onClick={() => navigate("/worker")}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white px-3 py-2 rounded-xl transition"
              >
                Available Requests
              </button>
              <button
                onClick={() => navigate("/worker/my-jobs")}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <span>My Hired Jobs</span>
                <Badge count={badgeSummary?.hiredJobs} size="sm" />
              </button>
              <button
                onClick={() => navigate("/worker/messages")}
                className="text-xs font-bold bg-navy/5 dark:bg-accent/20 text-navy dark:text-accent px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <span>Messages</span>
                <Badge count={badgeSummary?.messages} size="sm" />
              </button>
              <button
                onClick={() => navigate("/worker/profile")}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white px-3 py-2 rounded-xl transition"
              >
                My Profile
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
            >
              <HomeIcon className="w-3.5 h-3.5" /> Customer View
            </button>
            <NotificationBell />
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition p-2 rounded-xl"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      ) : (
        <Navbar />
      )}

      {/* Main Messages Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        <div className="flex-1 bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800/80 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px] h-[calc(100vh-140px)]">
          {/* LEFT PANEL: Conversation List */}
          <section
            className={`w-full md:w-80 lg:w-96 border-r border-[#EBE6DA] dark:border-gray-800/80 flex flex-col bg-white dark:bg-[#132320] ${
              selectedJobId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#EBE6DA] dark:border-gray-800/80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-extrabold text-navy dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" /> Messages
                </h2>
                <MessagesUnreadBadge />
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Conversation List Stream */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EBE6DA]/50 dark:divide-gray-800/50">
              {loadingConversations ? (
                <div className="p-6 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <span className="text-xs">Loading conversations…</span>
                </div>
              ) : conversationsError ? (
                <div className="p-6 text-center text-xs text-rose-500">
                  Failed to load conversations. Please refresh.
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 text-gray-400">
                    <MessageSquare className="w-6 h-6 opacity-60" />
                  </div>
                  <h3 className="font-bold text-sm text-navy dark:text-white mb-1">No conversations</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
                    Active jobs with assigned professionals will appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.jobId === selectedJobId;
                  const photo = conv.otherParty?.profilePhoto || conv.otherPartyProfilePhoto;
                  const name = conv.otherParty?.name || conv.otherPartyName || "User";

                  return (
                    <button
                      key={conv.jobId}
                      type="button"
                      onClick={() => {
                        setSelectedJobId(conv.jobId);
                        setSearchParams({ jobId: conv.jobId });
                      }}
                      className={`w-full text-left p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                        isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600 dark:border-accent"
                          : "hover:bg-gray-50 dark:hover:bg-[#0f1f1c]"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-11 h-11 rounded-2xl bg-navy/10 dark:bg-gray-700 text-navy dark:text-accent font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-navy/10 dark:border-gray-600 shadow-xs">
                        {photo ? (
                          <img src={photo} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-navy dark:text-white text-xs truncate">
                            {name}
                          </h4>
                          {conv.lastMessage?.time && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium shrink-0 ml-1">
                              {formatTime(conv.lastMessage.time)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {conv.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage?.text || "Started conversation"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-emerald-600 dark:bg-accent text-white dark:text-navy text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-xs">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* RIGHT PANEL: Chat Panel */}
          <section
            className={`w-full flex-1 flex flex-col bg-[#FAF9F5] dark:bg-[#0c1816] ${
              selectedJobId ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedJobId && activeConversation ? (
              <>
                {/* Chat Top Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white dark:bg-[#132320] border-b border-[#EBE6DA] dark:border-gray-800/80 flex items-center justify-between shadow-xs z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobId("");
                        setSearchParams({});
                      }}
                      className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-navy dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      aria-label="Back to conversations list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-2xl bg-navy/10 dark:bg-gray-700 text-navy dark:text-accent font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-navy/10 dark:border-gray-600 shadow-xs">
                      {activeConversation.otherParty?.profilePhoto ? (
                        <img
                          src={activeConversation.otherParty.profilePhoto}
                          alt={activeConversation.otherParty.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (activeConversation.otherParty?.name || "U").charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-navy dark:text-white text-sm sm:text-base truncate">
                        {activeConversation.otherParty?.name || "Conversation"}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate flex items-center gap-1.5">
                        <span className="text-emerald-700 dark:text-accent font-bold">
                          {activeConversation.category}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isWorkerPortal) {
                          navigate("/worker/my-jobs");
                        } else {
                          navigate(`/home/jobs/${selectedJobId}`);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-navy dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-[#EBE6DA] dark:border-gray-800 transition"
                      title="View Job Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Job Details</span>
                    </button>
                  </div>
                </div>

                {/* Error Banner if message closed / failure */}
                {sendError && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs px-4 py-2.5 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{sendError}</span>
                    </div>
                    <button
                      onClick={() => setSendError(null)}
                      className="text-xs font-bold hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Load earlier button */}
                  {hasMoreEarlier && messages.length >= 50 && (
                    <div className="flex justify-center pb-2">
                      <button
                        type="button"
                        onClick={handleLoadEarlier}
                        disabled={loadingEarlier}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-[#162724] border border-[#EBE6DA] dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-xs disabled:opacity-50"
                      >
                        {loadingEarlier ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading earlier…
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Load earlier messages
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Messages list */}
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center text-gray-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      <span className="text-xs">Loading messages…</span>
                    </div>
                  ) : messagesError ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                      <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                      <p className="text-sm font-bold text-navy dark:text-white">
                        Could not load messages
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        {(messagesErrorObj as any)?.response?.data?.message ||
                          "This job conversation may not be accessible."}
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-accent flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-base text-navy dark:text-white mb-1">
                        No messages yet. Say hello
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        Coordinate details, arrival time, and service instructions!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                      const isMe = senderId === user?.id;
                      const isLastReadMessage = msg._id === lastReadMessageId;

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] shadow-xs ${
                              isMe
                                ? "bg-emerald-700 text-white dark:bg-accent dark:text-navy rounded-tr-xs"
                                : "bg-white dark:bg-[#162724] border border-[#EBE6DA] dark:border-gray-800 text-navy dark:text-white rounded-tl-xs"
                            }`}
                          >
                            {/* Plain text only - NEVER dangerouslySetInnerHTML */}
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                              {msg.text}
                            </p>
                            <div
                              className={`text-[10px] mt-1 text-right font-medium ${
                                isMe
                                  ? "text-emerald-100 dark:text-navy/70"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>

                          {/* "Seen" label under my last read message */}
                          {isMe && isLastReadMessage && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-accent mt-1 mr-1">
                              <CheckCheck className="w-3 h-3" />
                              <span>Seen</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 sm:p-4 bg-white dark:bg-[#132320] border-t border-[#EBE6DA] dark:border-gray-800/80">
                  <div className="flex items-end gap-2 sm:gap-3 bg-gray-50 dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      disabled={isSending}
                      className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-navy dark:text-white placeholder-gray-400 focus:outline-none resize-none max-h-32 min-h-[38px] py-2 px-1"
                    />

                    <div className="flex items-center gap-2 shrink-0 pb-1">
                      {/* Character Counter */}
                      <span
                        className={`text-[10px] font-bold tabular-nums ${
                          inputText.length > 1000
                            ? "text-rose-500"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {inputText.length}/1000
                      </span>

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || !inputText.trim() || inputText.length > 1000}
                        className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy flex items-center justify-center transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Send message"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* No Conversation Selected (Desktop Placeholder) */
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-gray-500">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-accent flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-navy dark:text-white mb-1">
                  Your Conversations
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                  Select a chat from the left panel to coordinate with your specialist or customer.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
