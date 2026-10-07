import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategories } from "../../services/categoryService";
import { createJob, uploadImages } from "../../services/jobService";
import { Navbar } from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  UploadCloud,
  X,
  CheckCircle,
  Loader2,
  ChevronLeft,
  Image as ImageIcon,
  HardHat,
  Wrench,
  Sparkles,
  Clock
} from "lucide-react";

export default function CreateRequest() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { categoryName?: string; description?: string } | null;
  const initialCategory = state?.categoryName || "";
  const initialDescription = state?.description || "";

  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState(initialDescription);
  const [images, setImages] = useState<{file: File, previewUrl: string}[]>([]);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: createJob,
    onError: (error: any) => {
      console.error("Job creation failed:", error);
      setErrorMessage(error?.response?.data?.message || "Couldn't post your request. Please check all fields and try again.");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImages = newFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setImages((prev) => {
        const combined = [...prev, ...newImages];
        return combined.slice(0, 5);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError("");
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
          setLocationError("Could not get your location. Please try again.");
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!category) {
      setErrorMessage("Please select a category");
      return;
    }
    if (description.length < 10) {
      setErrorMessage("Description must be at least 10 characters");
      return;
    }

    setUploadError("");
    let uploadedUrls: string[] = [];

    if (images.length > 0) {
      setIsUploading(true);
      try {
        const filesToUpload = images.map(img => img.file);
        uploadedUrls = await uploadImages(filesToUpload);
      } catch (error: any) {
        setUploadError(error.response?.data?.message || "Failed to upload images");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    mutation.mutate({
      category,
      description,
      images: uploadedUrls,
      location: locationData || { lat: 0, lng: 0 },
    });
  };

  if (mutation.isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden font-sans relative flex flex-col transition-colors duration-300">
        <Navbar />

        <div className="absolute top-0 left-0 w-full h-[22vh] bg-gradient-to-br from-navy via-navy to-[#132823] dark:from-[#0B1513] dark:via-[#101F1C] dark:to-[#0B1513] z-0 overflow-hidden rounded-b-[2rem] shadow-lg">
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-emerald-500/20 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 mt-10 sm:mt-16 mb-20">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="w-full max-w-lg bg-white dark:bg-[#132320]/95 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-green-400/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="relative mx-auto w-56 h-56 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-accent/20 rounded-full blur-2xl"
              />
              <motion.img
                src="/worker_on_the_way.png"
                alt="Worker on the way"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
                className="w-full h-full object-contain relative z-10 drop-shadow-xl"
              />
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-extrabold text-navy dark:text-white mb-3 tracking-tight relative z-10"
            >
              Request Posted!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 dark:text-gray-300 mb-8 text-base leading-relaxed max-w-sm mx-auto relative z-10"
            >
              Your work for <span className="font-bold text-navy dark:text-white">{category}</span> will be in expert hands soon! Nearby professionals have been alerted and will respond shortly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-10"
            >
              <button
                onClick={() => navigate("/home")}
                className="bg-navy hover:bg-accent text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden font-sans relative transition-colors duration-300">
      <Navbar />

      <div className="absolute top-0 left-0 w-full h-[22vh] bg-gradient-to-br from-navy via-navy to-[#132823] dark:from-[#0B1513] dark:via-[#101F1C] dark:to-[#0B1513] z-0 overflow-hidden rounded-b-[2rem] shadow-lg">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-emerald-500/20 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />
      </div>

      <div className="max-w-3xl mx-auto pt-4 sm:pt-6 px-4 sm:px-6 pb-32 relative z-10 mt-4 sm:mt-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white font-semibold mb-4 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white dark:bg-[#132320]/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl border border-[#EBE6DA] dark:border-gray-800 p-6 sm:p-8 relative overflow-hidden"
        >


          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="mb-6 text-center sm:text-left relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy dark:text-white mb-2 tracking-tight">
              Create Service <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-600">Request</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-300 text-sm sm:text-base max-w-xl">Describe what you need in detail, and we'll connect you with top-rated professionals nearby in seconds.</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl relative z-10">
              <p className="text-red-600 text-sm font-semibold text-center sm:text-left">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Service Category</label>
                {loadingCategories ? (
                  <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
                ) : (
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 text-navy dark:text-white text-base rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent block px-4 py-3 outline-none transition-all shadow-sm appearance-none font-medium"
                    >
                      <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Select a category</option>
                      {categories?.map((cat) => (
                        <option key={cat._id} value={cat.name} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Detailed Description</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    minLength={10}
                    rows={4}
                    placeholder="E.g., I need a plumber to fix a leaking pipe under the kitchen sink..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 text-navy dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent block px-4 py-3 outline-none transition-all shadow-sm resize-none font-medium"
                  />
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                    <p className={`text-[10px] font-bold tracking-wide ${description.length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                      {description.length}/500 chars
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Photos (Optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-accent hover:bg-accent/5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 relative z-10">
                    <UploadCloud className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-navy dark:text-white font-semibold text-base mb-1 relative z-10">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10">High quality images help pros understand the job</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                {uploadError && <p className="text-red-500 text-xs font-semibold pl-1 mt-1">{uploadError}</p>}

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                    <AnimatePresence>
                      {images.map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group shadow-sm"
                        >
                          <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-red-500 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Service Location</label>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${locationData ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-400 border border-gray-100 dark:border-gray-700'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy dark:text-white text-base">Current Address</h4>
                      {locationData ? (
                        <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Location captured</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-0.5">We need your coordinates to match nearby pros.</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={locationLoading || !!locationData}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      locationData
                      ? 'bg-green-50 text-green-700 border border-green-200 shadow-none'
                      : 'bg-white text-navy border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {locationLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Locating...</span>
                    ) : locationData ? (
                      'Location Set'
                    ) : (
                      'Use My Location'
                    )}
                  </button>
                </div>
                {locationError && <p className="text-red-500 text-xs font-semibold pl-1 mt-1">{locationError}</p>}
              </div>
            </div>

            <div className="pt-6 relative z-10 border-t border-gray-100 mt-8">
              <button
                type="submit"
                disabled={mutation.isPending || isUploading || !category || description.length < 10}
                className="w-full bg-navy hover:bg-accent disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg py-4 text-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
              >
                {mutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> {isUploading ? "Uploading Images..." : "Processing..."}
                  </>
                ) : (
                  <>
                    Post Service Request
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1.5 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
