import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, updateUserProfile, uploadImage } from "../../services/userService";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Save,
  ArrowLeft,
  Wrench,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserProfile(user.id)
      .then((data) => {
        if (data) {
          setName(data.name || user.name || "");
          setPhone(data.phone || "");
          setProfilePhoto(data.profilePhoto || "");
          setPreviewPhoto(data.profilePhoto || "");
          updateUser({
            name: data.name,
            phone: data.phone,
            profilePhoto: data.profilePhoto,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile:", err);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploading(true);
    setErrorMsg(null);
    try {
      const uploadedUrl = await uploadImage(file);
      setProfilePhoto(uploadedUrl);
      setPreviewPhoto(uploadedUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setErrorMsg("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!name.trim()) {
      setErrorMsg("Name cannot be empty");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatedUser = await updateUserProfile(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        profilePhoto,
      });

      updateUser({
        name: updatedUser.name,
        phone: updatedUser.phone,
        profilePhoto: updatedUser.profilePhoto,
      });

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-navy dark:text-gray-400 dark:hover:text-white transition-colors bg-white dark:bg-[#132320] px-3.5 py-2 rounded-xl border border-[#EBE6DA] dark:border-gray-800 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            Account Settings
          </span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-[#132320]/95 border border-[#EBE6DA] dark:border-gray-800 rounded-3xl p-4 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl relative overflow-hidden">

          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-0 pointer-events-none" />

          {/* Success Banner */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-700 dark:text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {/* Profile Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-navy text-accent font-extrabold text-4xl flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden relative">
                    {previewPhoto ? (
                      <img
                        src={previewPhoto}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{name?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}

                    {uploading && (
                      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-accent hover:bg-amber-400 text-navy rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 transition-all transform hover:scale-105"
                    title="Upload Profile Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h2 className="text-xl font-extrabold text-navy dark:text-white">{name || "Customer Profile"}</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">{user?.email}</p>
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/5 dark:bg-white/10 text-navy dark:text-white border border-navy/10 dark:border-white/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Verified Customer
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-navy focus:ring-2 focus:ring-navy/10 transition outline-none text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-navy focus:ring-2 focus:ring-navy/10 transition outline-none text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Email Address (Read-only) */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 text-sm font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Email address cannot be changed for security reasons.
                  </p>
                </div>
                {/* Dual Role Status Card */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {user?.hasWorkerProfile || user?.role === "worker" ? "Worker Account Linked" : "Offer Professional Services"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {user?.hasWorkerProfile || user?.role === "worker"
                          ? "Your account has access to the Worker Portal."
                          : "Register your skills to start accepting local service requests."}
                      </p>
                    </div>
                  </div>

                  {user?.hasWorkerProfile || user?.role === "worker" ? (
                    <button
                      type="button"
                      onClick={() => navigate("/worker")}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Worker View
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/become-worker")}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Become a Worker
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-navy hover:bg-navy/90 text-white font-extrabold text-sm shadow-lg shadow-navy/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-accent" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
