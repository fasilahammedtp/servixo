import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { becomeWorker } from "../../services/workerService";
import { getCategories } from "../../services/categoryService";
import { Logo } from "../../components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Wrench,
  Briefcase,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
} from "lucide-react";

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

export default function BecomeWorker() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [skills, setSkills] = useState<string[]>(["Handyman"]);
  const [customSkill, setCustomSkill] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">(3);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(15);
  const [visitingCharge, setVisitingCharge] = useState<number | "">(25);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch categories from DB
  const { data: dbCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categoryNames = Array.from(
    new Set([
      ...(dbCategories && dbCategories.length > 0
        ? dbCategories.map((c) => c.name)
        : DEFAULT_SKILL_OPTIONS),
      ...skills,
    ])
  );

  const toggleSkill = (skillName: string) => {
    setSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGettingLocation(false);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError("Could not fetch location. Please allow GPS access.");
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (skills.length === 0) {
      setErrorMessage("Please select at least one skill category.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        skills,
        experienceYears: Number(experienceYears) || 0,
        serviceRadiusKm: Number(serviceRadiusKm) || 10,
        visitingCharge: Number(visitingCharge) || 0,
        location: locationData || undefined,
      };

      const res = await becomeWorker(payload);
      
      // Update local auth context
      updateUser({ hasWorkerProfile: true });
      queryClient.invalidateQueries({ queryKey: ["workerProfile"] });

      setSuccessMessage("Worker profile created successfully! Redirecting to Worker Portal...");
      setTimeout(() => {
        navigate("/worker");
      }, 1500);
    } catch (err: any) {
      console.error("Become worker error:", err);
      setErrorMessage(
        err?.response?.data?.message || "Failed to create worker profile. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#070D0C] text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500/20 pb-16 transition-colors duration-300">
      {/* Header Bar */}
      <header className="bg-[#FAF9F5]/90 dark:bg-[#0E1A18]/80 backdrop-blur-md border-b border-[#EBE6DA] dark:border-[#1C322C] px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#142420] hover:bg-slate-100 dark:hover:bg-[#1C322C] flex items-center justify-center text-slate-700 dark:text-slate-300 transition border border-[#EBE6DA] dark:border-[#1E3630]"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">Servixo</h1>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-0.5">
              Create Worker Profile
            </p>
          </div>
        </div>


      </header>

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 dark:from-[#091311] dark:via-[#0E1B18] dark:to-[#091512] py-10 px-6 overflow-hidden rounded-b-[2.5rem] shadow-xl text-white mb-8">
        <div className="absolute top-0 right-0 w-[24rem] h-[24rem] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Dual-Role Enablement
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Start Offering Professional Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Unlock the Worker Portal on your account while keeping all your customer history intact. Receive live requests, send quotes, and build your earnings portfolio.
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg">
            <Wrench className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Error / Success Notifications */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Skill Categories */}
          <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F2ECE1] dark:border-[#1C322C]">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Skill Categories & Expertise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the types of service requests you are qualified to receive and fulfill.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mb-6">
              {categoryNames.map((catName) => {
                const isSelected = skills.includes(catName);
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => toggleSkill(catName)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-sm"
                        : "bg-[#FAF9F5] dark:bg-[#142420] text-slate-700 dark:text-slate-300 border-[#EBE6DA] dark:border-[#1E3630] hover:border-amber-400/50"
                    }`}
                  >
                    {catName}
                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add custom skill (e.g. Solar Panel Fitting)"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                className="flex-1 bg-[#FAF9F5] dark:bg-[#142420] border border-[#EBE6DA] dark:border-[#1E3630] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Card 2: Professional Rates & Experience */}
          <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F2ECE1] dark:border-[#1C322C]">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Rates & Experience
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set your base visiting inspection fee and total industry experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Visiting Charge */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Base Visiting Fee ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={visitingCharge}
                    onChange={(e) => setVisitingCharge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#FAF9F5] dark:bg-[#142420] border border-[#EBE6DA] dark:border-[#1E3630] rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    placeholder="25"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Standard charge for inspecting & diagnosing customer issues on site.</p>
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] dark:bg-[#142420] border border-[#EBE6DA] dark:border-[#1E3630] rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  placeholder="3"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Years of experience performing these service types.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Service Radius & Location */}
          <div className="bg-white dark:bg-[#0F1B18]/95 backdrop-blur-xl border border-[#EBE6DA] dark:border-[#1C322C] rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F2ECE1] dark:border-[#1C322C]">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Coverage Radius & GPS Location
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Specify how far you are willing to travel for service calls.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Service Radius
                  </label>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {serviceRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>5 km (Local)</span>
                  <span>50 km</span>
                  <span>100 km (Regional)</span>
                </div>
              </div>

              {/* GPS Detection */}
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#142420] rounded-2xl border border-[#EBE6DA] dark:border-[#1E3630] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      GPS Base Coordinates
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {locationData
                        ? `Coordinates set: Lat ${locationData.lat.toFixed(4)}, Lng ${locationData.lng.toFixed(4)}`
                        : "Detect your base location to match nearby customer requests accurately."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={gettingLocation}
                  className="bg-slate-900 text-white dark:bg-slate-800 dark:text-amber-300 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" /> Detect My GPS Location
                    </>
                  )}
                </button>
              </div>
              {locationError && <p className="text-xs text-red-500 font-semibold">{locationError}</p>}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#142420] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl text-xs transition shadow-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Worker Profile...
                </>
              ) : (
                <>
                  Create Worker Profile <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
