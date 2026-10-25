import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCategories } from "../../services/categoryService";
import { Navbar } from "../../components/Navbar";
import { motion } from "framer-motion";
import {
  Search,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Briefcase,
  Home as HomeIcon,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import { Category } from "../../types";
import { getCategoryIcon, resolveCategoryPhoto } from "../../utils/categoryTheme";

export default function Services() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  const handleSelectCategory = (categoryName: string) => {
    navigate("/home/create-request", { state: { categoryName } });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0B1513] overflow-x-hidden font-sans transition-colors duration-300">
      <Navbar />

      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white dark:bg-gray-800/80 text-accent font-bold text-xs mb-4 border border-[#EBE6DA] dark:border-gray-700/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-4 h-4 text-accent" /> Professional Home Services
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy dark:text-white mb-4 tracking-tight">
            Explore All <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-600 dark:to-emerald-400">Services</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-8 font-medium">
            Browse our wide range of service categories and hire verified experts near you in minutes.
          </p>

          <div className="relative max-w-xl mx-auto">
            <div className="flex items-center bg-white dark:bg-[#142623]/90 backdrop-blur-2xl border border-[#E5DEC9] dark:border-gray-700/80 p-2 rounded-full shadow-[0_10px_35px_rgba(60,50,20,0.06)]">
              <div className="pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search services (e.g. Plumbing, Cleaning)..."
                className="w-full pl-3 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-navy dark:text-white font-medium placeholder-gray-400 text-sm sm:text-base outline-none min-h-[40px]"
              />
            </div>
          </div>
        </motion.div>
      </section>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-56 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm animate-pulse rounded-3xl border border-white dark:border-gray-700"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#132320] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <Wrench className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-xl font-extrabold text-navy dark:text-white mb-1">No services found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              We couldn't find any category matching "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredCategories.map((category, i) => {
              const { imageUrl: catImage } = resolveCategoryPhoto(category);
              const isOther = category.name.toLowerCase() === "other";

              return (
                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={category._id}
                  onClick={() => handleSelectCategory(category.name)}
                  className="relative h-60 rounded-[2rem] text-left overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_rgba(8,112,184,0.2)] transition-all duration-300 border border-white/40 dark:border-gray-700/50 bg-white dark:bg-[#132320] flex flex-col justify-end"
                >
                  {catImage ? (
                    <img
                      src={catImage}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out z-0"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-navy to-[#132823] flex items-center justify-center overflow-hidden z-0">
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="opacity-20 transform scale-[2.8] group-hover:scale-[3.2] transition-transform duration-700 text-white pointer-events-none">
                        {getCategoryIcon(category.name)}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-85" />

                  <div className="absolute inset-0 p-5 flex flex-col justify-end z-20">
                    <div className="w-11 h-11 mb-3 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-accent group-hover:border-accent group-hover:scale-110 transition-all duration-300">
                      {getCategoryIcon(category.name)}
                    </div>
                    <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-wide group-hover:text-accent-light transition-colors flex items-center justify-between">
                      <span>{category.name}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                      {category.description || (isOther ? "Custom or specialized service requests." : "Book top-rated specialists near you.")}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
