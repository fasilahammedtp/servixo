import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeServerWake } from "../services/api";

export default function ServerWakeNotice() {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeServerWake((waking) => {
      setIsWaking(waking);
    });
    return unsubscribe;
  }, []);

  if (!isWaking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs sm:text-sm font-medium rounded-full shadow-2xl backdrop-blur-md border border-slate-700/50">
        <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
        <span>Server is waking up, please wait...</span>
      </div>
    </div>
  );
}
