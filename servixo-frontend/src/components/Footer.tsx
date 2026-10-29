import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { SOCIAL_LINKS } from "../constants/socialLinks";

export function Footer() {
  return (
    <footer className="bg-navy dark:bg-[#0A1412] border-t border-white/10 dark:border-gray-800/80 relative z-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo className="w-6 h-6" />
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Servixo. All rights reserved.</p>
        </div>

        <div className="flex items-center gap-5 text-xs text-white/60">
          <Link to="/terms" className="hover:text-accent transition">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="hover:text-accent transition">
            Privacy Policy
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={SOCIAL_LINKS.INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/40 hover:text-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy dark:focus-visible:ring-offset-[#0A1412]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href={SOCIAL_LINKS.LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/40 hover:text-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy dark:focus-visible:ring-offset-[#0A1412]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
