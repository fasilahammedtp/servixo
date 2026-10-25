import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getWorkerProfile, updateWorkerProfile } from "../../services/workerService";
import { uploadProfilePhoto } from "../../services/userService";
import { getCategories } from "../../services/categoryService";
import { Logo } from "../../components/Logo";
import { NotificationBell } from "../../components/NotificationBell";
import { Badge } from "../../components/Badge";
import { useBadgeSummary } from "../../hooks/useBadgeSummary";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  User,
  Wrench,
  Briefcase,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  X,
  Save,
  Loader2,
  ShieldCheck,
  Compass,
  Sparkles,
  LogOut,
  Star,
  Camera,
  Home as HomeIcon,
} from "lucide-react";

import { getWorkerReviews } from "../../services/reviewService";


const DEFAULT_SKILL_OPTIONS = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "AC Repair",
  "Appliance Repair",
  "Roofing",
  "Landscaping",
  "Pest Control",
  "Handyman",
];

export default function WorkerProfile() {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser, logout } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { data: badgeSummary } = useBadgeSummary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      if (notification?.type === "worker_verified" || notification?.type === "worker_rejected") {
        const isApproved = notification.type === "worker_verified";
        const newStatus = isApproved ? "verified" : "rejected";

        queryClient.setQueryData(["workerProfile", user?.id], (oldWorker: any) => {
          if (!oldWorker) return oldWorker;
          return {
            ...oldWorker,
            verificationStatus: newStatus,
          };
        });

        queryClient.setQueriesData({ queryKey: ["workerProfile"] }, (oldWorker: any) => {
          if (!oldWorker) return oldWorker;
          return {
            ...oldWorker,
            verificationStatus: newStatus,
          };
        });

        queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
        updateUser({ verificationStatus: newStatus });
      } else if (notification?.type === "review_received") {
        console.log("⭐ [Worker Profile] Review received event! Invalidating profile & reviews...", notification);
        
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

        queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["workerReviews"] });
      }
    };

    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, queryClient, user?.id, updateUser]);

  const [skills, setSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(10);
  const [visitingCharge, setVisitingCharge] = useState<number | "">("");
  const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const uploadedUrl = await uploadProfilePhoto(file);
      updateUser({ profilePhoto: uploadedUrl });
      queryClient.invalidateQueries({ queryKey: ["workerProfile"] });
      setSuccessMessage("Profile photo updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Profile photo upload failed:", err);
      setErrorMessage(
        err?.response?.data?.message || "Failed to upload profile photo. Please try again."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };


  // Fetch categories from DB
  const { data: dbCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch worker profile - poll every 30s while pending, refetch on window focus
  const { data: worker, isLoading: loadingProfile } = useQuery({
    queryKey: ["workerProfile", user?.id],
    queryFn: () => getWorkerProfile(user!.id),
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.verificationStatus === "pending" ? 30000 : false;
    },
  });

  // Load skills from active categories, while keeping skills worker already has even if hidden or custom
  const categoryNames = Array.from(
    new Set([
      ...(dbCategories?.map((c) => c.name) || []),
      ...(worker?.skills || []),
      ...skills,
    ])
  );

  // Safety net: refetch worker profile when tab regains focus or becomes visible
  useEffect(() => {
    if (!user?.id) return;

    const handleFocusOrVisible = () => {
      queryClient.invalidateQueries({ queryKey: ["workerProfile", user.id] });
    };

    window.addEventListener("focus", handleFocusOrVisible);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleFocusOrVisible();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, queryClient]);

  // Keep AuthContext user and localStorage synchronized with worker.verificationStatus
  useEffect(() => {
    if (worker?.verificationStatus && user && user.verificationStatus !== worker.verificationStatus) {
      updateUser({ verificationStatus: worker.verificationStatus });
    }
  }, [worker?.verificationStatus, user, updateUser]);

  // Fetch worker reviews
  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ["workerReviews", worker?._id],
    queryFn: () => getWorkerReviews(worker!._id),
    enabled: !!worker?._id,
  });


  // Populate form state when worker profile is loaded
  useEffect(() => {
    if (worker) {
      setSkills(worker.skills || []);
      setExperienceYears(worker.experienceYears ?? "");
      setServiceRadiusKm(worker.serviceRadiusKm ?? 10);
      setVisitingCharge(worker.visitingCharge ?? "");
      if (worker.location && worker.location.coordinates?.length === 2) {
        // Mongo coordinates are [lng, lat]
        const [lng, lat] = worker.location.coordinates;
        if (lng !== 0 || lat !== 0) {
          setLocationData({ lat, lng });
        }
      }
    }
  }, [worker]);

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      skills: string[];
      experienceYears: number;
      serviceRadiusKm: number;
      visitingCharge: number;
      location?: { lat: number; lng: number };
    }) =>
      updateWorkerProfile(payload.userId, {
        skills: payload.skills,
        experienceYears: payload.experienceYears,
        serviceRadiusKm: payload.serviceRadiusKm,
        visitingCharge: payload.visitingCharge,
        location: payload.location,
      }),
    onSuccess: async (updatedWorker) => {
      // 1. Immediately cache updated worker
      queryClient.setQueryData(["workerProfile", user?.id], updatedWorker);
      // Invalidate queries so that worker dashboard and jobs will refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workerProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["nearbyJobs"] }),
        queryClient.invalidateQueries({ queryKey: ["workerDashboardStats"] }),
      ]);

      // 2. Refetch the auth user so the dashboard shows updated state immediately
      try {
        await refreshUser();
      } catch (err) {
        console.warn("Could not refetch auth user:", err);
      }

      // 3. Show success toast, then navigate to /worker (replace)
      setSuccessMessage("Profile updated successfully!");
      setErrorMessage("");
      setInvalidFields({});

      setTimeout(() => {
        navigate("/worker", {
          replace: true,
          state: { toastMessage: "Profile updated successfully!" },
        });
      }, 800);
    },
    onError: (error: any) => {
      const respData = error?.response?.data;
      const backendMessage =
        respData?.message || error?.message || "Failed to update profile. Please try again.";
      const newInvalidFields: Record<string, string> = {};

      if (Array.isArray(respData?.errors) && respData.errors.length > 0) {
        const fieldErrorMsgs: string[] = [];
        respData.errors.forEach((e: { field?: string; message: string }) => {
          if (e.field) {
            newInvalidFields[e.field] = e.message;
            fieldErrorMsgs.push(`${e.field}: ${e.message}`);
          } else {
            fieldErrorMsgs.push(e.message);
          }
        });
        setErrorMessage(fieldErrorMsgs.join(" | ") || backendMessage);
      } else {
        setErrorMessage(backendMessage);
      }

      setInvalidFields(newInvalidFields);
    },
  });

  const toggleSkill = (skill: string) => {
    setInvalidFields((prev) => {
      const copy = { ...prev };
      delete copy.skills;
      return copy;
    });
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setInvalidFields((prev) => {
        const copy = { ...prev };
        delete copy.skills;
        return copy;
      });
      setSkills((prev) => [...prev, trimmed]);
      setCustomSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    setInvalidFields((prev) => {
      const copy = { ...prev };
      delete copy.location;
      return copy;
    });
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          setLocationError("Could not retrieve GPS location. Please check browser permissions.");
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const errors: Record<string, string> = {};

    if (skills.length === 0) {
      errors.skills = "Please select at least one skill to receive job matches.";
    }

    if (experienceYears === "" || isNaN(Number(experienceYears)) || Number(experienceYears) < 0) {
      errors.experienceYears = "Please enter valid years of experience (0 or more).";
    }

    if (visitingCharge === "" || isNaN(Number(visitingCharge)) || Number(visitingCharge) < 0) {
      errors.visitingCharge = "Please enter a valid visiting fee (0 or more).";
    }

    if (serviceRadiusKm < 1) {
      errors.serviceRadiusKm = "Service radius must be at least 1 km.";
    }

    if (Object.keys(errors).length > 0) {
      setInvalidFields(errors);
      const firstError = Object.values(errors)[0];
      setErrorMessage(firstError);
      return;
    }

    if (!user?.id) {
      setErrorMessage("User session not found. Please log in again.");
      return;
    }

    setInvalidFields({});

    updateMutation.mutate({
      userId: user.id,
      skills,
      experienceYears: Number(experienceYears),
      serviceRadiusKm,
      visitingCharge: Number(visitingCharge),
      location: locationData || undefined,
    });
  };

  const getStatusBadge = () => {
    if (!worker) return null;
    switch (worker.verificationStatus) {
      case "verified":
        return (
          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Partner
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Verification Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] font-sans selection:bg-accent/30 overflow-x-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-[#FAF9F5]/90 dark:bg-[#101F1C]/90 backdrop-blur-md border-b border-[#EBE6DA] dark:border-gray-800/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-xs sticky top-0 z-30 transition-colors duration-300">
        <div className="flex items-center gap-2.5 sm:gap-3">

          <button
            onClick={() => navigate("/worker")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center justify-center text-navy dark:text-white transition-all border border-gray-200 dark:border-gray-700/80"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Logo className="w-9 h-9 sm:w-10 sm:h-10" />
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-navy dark:text-white leading-none">Servixo</h1>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider mt-0.5">
              Worker Profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
            title="Switch to Customer Portal"
          >
            <HomeIcon className="w-3.5 h-3.5" /> Customer View
          </button>
          <NotificationBell />
          <button
            onClick={logout}
            className="text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Worker Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-b border-[#EBE6DA] dark:border-gray-800 bg-white/80 dark:bg-[#101F1C]/90 backdrop-blur-md px-2 py-2 sticky top-[57px] z-20">
        <button
          onClick={() => navigate("/worker")}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[36px]"
        >
          Requests
        </button>
        <button
          onClick={() => navigate("/worker/my-jobs")}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[36px] flex items-center gap-1.5"
        >
          <span>My Jobs</span>
          <Badge count={badgeSummary?.hiredJobs} size="sm" />
        </button>
        <button
          onClick={() => navigate("/worker/messages")}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[36px] flex items-center gap-1.5"
        >
          <span>Messages</span>
          <Badge count={badgeSummary?.messages} size="sm" />
        </button>
        <button
          onClick={() => navigate("/worker/profile")}
          className="text-xs font-bold text-navy dark:text-accent py-1.5 px-3 rounded-lg bg-navy/5 dark:bg-accent/20 min-h-[36px]"
        >
          My Profile
        </button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 max-w-md w-full bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 backdrop-blur-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-white">Profile Updated</h4>
              <p className="text-xs text-emerald-200 mt-0.5">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loadingProfile ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-navy border-t-accent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-navy via-navy to-blue-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col min-[460px]:flex-row items-center min-[460px]:items-start sm:items-center text-center min-[460px]:text-left gap-4 sm:gap-5 relative z-10 w-full sm:w-auto">
                <div
                  className="relative group cursor-pointer flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile photo"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md text-amber-400 font-black text-3xl flex items-center justify-center border border-white/20 shadow-inner overflow-hidden relative">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0) || "W"}</span>
                    )}

                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl flex items-center justify-center shadow-lg border-2 border-navy transition-all transform hover:scale-110"
                    title="Upload Profile Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{user?.name}</h2>
                  <p className="text-xs text-blue-200 font-medium mt-0.5 truncate">{user?.email}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center min-[460px]:justify-start gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-blue-100 border border-white/10">
                      {user?.role}
                    </span>
                    <span className="text-[11px] font-extrabold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {worker?.rating ? worker.rating.toFixed(1) : "0.0"} ★ ({worker?.totalReviews || 0} reviews)
                    </span>
                  </div>

                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center sm:items-end">
                <span className="text-[11px] text-blue-200 font-bold uppercase tracking-wider mb-1.5">
                  Verification Status
                </span>
                {getStatusBadge()}
              </div>
            </motion.div>

            {/* Profile Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Skills Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`bg-white dark:bg-[#132320] border rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 ${
                  invalidFields.skills
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-gray-200/80 dark:border-gray-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-navy dark:text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-accent" /> Professional Skills & Services
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      Select the categories you are qualified to serve. Jobs will match based on these skills.
                    </p>
                  </div>
                </div>

                {/* Pre-set Category Chips */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-2">
                    Select Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryNames.map((skill) => {
                      const isSelected = skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 min-h-[40px] ${
                            isSelected
                              ? "bg-navy dark:bg-accent text-white dark:text-navy border-navy dark:border-accent shadow-md scale-105"
                              : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700/60 hover:border-navy dark:hover:border-accent hover:text-navy dark:hover:text-white"
                          }`}
                        >
                          {skill}
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-accent dark:text-navy" />}
                        </button>
                      );
                    })}
                  </div>
                  {invalidFields.skills && (
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {invalidFields.skills}
                    </p>
                  )}
                </div>

                {/* Add Custom Skill Tag */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-2">
                    Add Custom Skill
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="e.g. Solar Panel Installation"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={handleAddCustomSkill}
                      className="flex-1 px-4 py-2.5 min-h-[42px] bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-accent/30 focus:border-navy dark:focus:border-accent transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-4 py-2.5 min-h-[42px] bg-navy dark:bg-accent hover:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                {/* Selected Active Skills Preview */}
                {skills.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block mb-2">
                      Active Selected Skills ({skills.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-accent/15 dark:bg-accent/20 text-navy dark:text-accent border border-accent/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Experience & Charges Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#132320] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] grid grid-cols-1 sm:grid-cols-2 gap-6 transition-colors duration-300"
              >
                <div>
                  <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-accent" /> Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      required
                      placeholder="e.g. 5"
                      value={experienceYears}
                      onChange={(e) => {
                        setInvalidFields((prev) => {
                          const copy = { ...prev };
                          delete copy.experienceYears;
                          return copy;
                        });
                        setExperienceYears(e.target.value === "" ? "" : Number(e.target.value));
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border rounded-xl text-sm font-bold text-navy dark:text-white focus:outline-none focus:ring-2 transition-all ${
                        invalidFields.experienceYears
                          ? "border-red-500 ring-2 ring-red-500/20 focus:ring-red-500/30"
                          : "border-gray-200 dark:border-gray-700 focus:ring-navy/20 dark:focus:ring-accent/30 focus:border-navy dark:focus:border-accent"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-400">
                      Years
                    </span>
                  </div>
                  {invalidFields.experienceYears && (
                    <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {invalidFields.experienceYears}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-1 font-medium">
                    Total years working in your field.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-accent" /> Standard Visiting Fee <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-navy dark:text-white">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      placeholder="e.g. 250"
                      value={visitingCharge}
                      onChange={(e) => {
                        setInvalidFields((prev) => {
                          const copy = { ...prev };
                          delete copy.visitingCharge;
                          return copy;
                        });
                        setVisitingCharge(e.target.value === "" ? "" : Number(e.target.value));
                      }}
                      className={`w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border rounded-xl text-sm font-bold text-navy dark:text-white focus:outline-none focus:ring-2 transition-all ${
                        invalidFields.visitingCharge
                          ? "border-red-500 ring-2 ring-red-500/20 focus:ring-red-500/30"
                          : "border-gray-200 dark:border-gray-700 focus:ring-navy/20 dark:focus:ring-accent/30 focus:border-navy dark:focus:border-accent"
                      }`}
                    />
                  </div>
                  {invalidFields.visitingCharge && (
                    <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {invalidFields.visitingCharge}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-1 font-medium">
                    Base inspection/visiting charge proposed to customers.
                  </p>
                </div>
              </motion.div>

              {/* Service Radius & Location Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#132320] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 transition-colors duration-300"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-accent" /> Service Radius
                    </label>
                    <span className="text-sm font-extrabold text-navy dark:text-accent bg-navy/5 dark:bg-accent/15 px-3 py-1 rounded-lg border border-navy/10 dark:border-accent/25">
                      {serviceRadiusKm} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={serviceRadiusKm}
                    onChange={(e) => {
                      setInvalidFields((prev) => {
                        const copy = { ...prev };
                        delete copy.serviceRadiusKm;
                        return copy;
                      });
                      setServiceRadiusKm(Number(e.target.value));
                    }}
                    className="w-full accent-navy dark:accent-accent cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  />
                  {invalidFields.serviceRadiusKm && (
                    <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {invalidFields.serviceRadiusKm}
                    </p>
                  )}
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-400 mt-1 uppercase tracking-wider">
                    <span>1 km (Local)</span>
                    <span>50 km</span>
                    <span>100 km (Regional)</span>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-2 font-medium">
                    You will receive nearby job requests posted within this radius.
                  </p>
                </div>

                {/* Location Detection */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent" /> Worker Location Coordinates
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          locationData
                            ? "bg-emerald-500 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy dark:text-white">
                          {locationData ? "Location Set" : "Location Not Set"}
                        </h4>
                        {locationData ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            GPS: {locationData.lat.toFixed(4)}, {locationData.lng.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">
                            Set location to accurately match jobs within your service radius.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-navy dark:text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap min-h-[42px]"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-navy dark:text-white" /> Detecting...
                        </>
                      ) : (
                        <>
                          <Compass className="w-4 h-4 text-accent" /> Update Current Location
                        </>
                      )}
                    </button>
                  </div>
                  {locationError && (
                    <p className="text-red-500 text-xs font-bold mt-2">{locationError}</p>
                  )}
                  {invalidFields.location && (
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {invalidFields.location}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Customer Ratings & Reviews Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-[#132320] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] transition-colors duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-navy dark:text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Customer Ratings & Reviews
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      Feedback from customers after job completion.
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-amber-50 dark:bg-amber-950/40 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                    <span className="text-xl font-black text-navy dark:text-amber-300">{worker?.rating ? worker.rating.toFixed(1) : "0.0"} ★</span>
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 block font-bold uppercase tracking-wider">
                      {worker?.totalReviews || 0} Total Reviews
                    </span>
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-navy dark:text-white mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-gray-400 font-semibold">Loading customer reviews...</p>
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-700/60">
                    <p className="text-xs text-gray-400 dark:text-gray-400 font-semibold">No reviews received yet. Complete jobs and confirm payment to earn customer reviews!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r: any) => (
                      <div key={r._id} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-navy dark:bg-gray-700 text-accent font-bold text-xs flex items-center justify-center border border-transparent dark:border-gray-600">
                              {r.customer?.name?.charAt(0) || "C"}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-navy dark:text-white">{r.customer?.name || "Customer"}</h5>
                              <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= r.rating ? "fill-amber-400 text-amber-500" : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 ml-1">{r.rating}.0</span>
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1 pl-10 italic">
                            "{r.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Real Error Message near the button */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-3 shadow-sm"
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </motion.div>
              )}

              {/* Submit & Cancel Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-2"
              >
                <button
                  type="button"
                  onClick={() => navigate("/worker")}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto px-8 py-3.5 bg-navy dark:bg-accent hover:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy text-sm font-extrabold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
