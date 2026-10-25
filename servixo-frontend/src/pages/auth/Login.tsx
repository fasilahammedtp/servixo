import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";

const BLOCKED_MESSAGE = "Your account has been blocked. Please contact support.";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isBlocked = searchParams.get("blocked") === "1";
  const isExpired = searchParams.get("expired") === "1";
  const [errorMessage, setErrorMessage] = useState(
    isBlocked
      ? BLOCKED_MESSAGE
      : isExpired
        ? "Your session has expired. Please log in again."
        : ""
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const verifiedSuccessMsg = (location.state as { verifiedMessage?: string })?.verifiedMessage;

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.user, data.token);

      const destination =
        data.user.role === "admin" ? "/admin" : data.user.role === "worker" ? "/worker" : "/home";
      navigate(destination);
    },
    onError: (error: any) => {
      const respMsg = error?.response?.data?.message;
      if (
        error?.response?.status === 403 &&
        typeof respMsg === "string" &&
        respMsg.toLowerCase().includes("block")
      ) {
        setUnverifiedEmail(null);
        setErrorMessage(BLOCKED_MESSAGE);
      } else if (
        error?.response?.status === 403 &&
        typeof respMsg === "string" &&
        respMsg.toLowerCase().includes("verify")
      ) {
        setUnverifiedEmail(email);
        setErrorMessage(respMsg);
      } else {
        setUnverifiedEmail(null);
        setErrorMessage(respMsg || "Login failed. Please try again.");
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setUnverifiedEmail(null);
    mutation.mutate({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-5 sm:p-8">
        <div className="flex justify-center mb-3">
          <Logo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Log in to your Servixo account</p>

        {verifiedSuccessMsg && !errorMessage && !unverifiedEmail && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg p-3 mb-4">
            {verifiedSuccessMsg}
          </div>
        )}

        {unverifiedEmail ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm rounded-lg p-3.5 mb-4 space-y-2">
            <p className="font-medium">{errorMessage}</p>
            <div>
              <Link
                to="/verify-otp"
                state={{ email: unverifiedEmail }}
                onClick={() => sessionStorage.setItem("pendingEmail", unverifiedEmail)}
                className="inline-flex items-center text-sm font-semibold text-accent hover:underline"
              >
                Verify your email &rarr;
              </Link>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-transparent dark:border-red-800/50 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-accent hover:underline inline-block py-1">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-navy text-white rounded-lg py-2.5 sm:py-3 font-semibold hover:bg-navy/90 transition disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          New here?{" "}
          <Link to="/signup" className="text-accent font-medium hover:underline inline-block py-1">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
