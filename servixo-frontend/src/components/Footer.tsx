import { Link } from "react-router-dom";
import { Logo } from "./Logo";

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

        <div className="flex items-center gap-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/40 hover:text-accent transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
            </svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/40 hover:text-accent transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-white/40 hover:text-accent transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
