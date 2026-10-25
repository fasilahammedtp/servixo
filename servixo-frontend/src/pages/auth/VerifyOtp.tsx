import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { verifyOtp, resendOtp } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  const state = location.state as { email?: string; devOtp?: string; emailSent?: boolean } | null;
  const initialEmail = state?.email || user?.email || sessionStorage.getItem("pendingEmail") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(60);

  const [devOtp, setDevOtp] = useState<string | undefined>(state?.devOtp);
  const [emailSent, setEmailSent] = useState<boolean | undefined>(state?.emailSent);

  useEffect(() => {
    if (!email) {
      const stored = sessionStorage.getItem("pendingEmail") || user?.email;
      if (stored) {
        setEmail(stored);
      }
    }
  }, [email, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      sessionStorage.removeItem("pendingEmail");
      if (user) {
        updateUser({ isEmailVerified: true });
        navigate(user?.role === "worker" ? "/worker/profile-setup" : "/home");
      } else {
        navigate("/login", {
          state: { verifiedMessage: "Email verified successfully! You can now log in." },
        });
      }
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || "Verification failed. Please try again.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: (data) => {
      setSuccessMessage("Verification code resent successfully.");
      setDevOtp(data.devOnly_otp);
      setEmailSent(data.emailSent);
      setErrorMessage("");
      setCooldown(60);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || "Failed to resend code.");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !email) return;

    setErrorMessage("");
    setSuccessMessage("");
    verifyMutation.mutate({ email, otp });
  };

  const handleResend = () => {
    if (cooldown > 0 || isPending || !email) return;
    setErrorMessage("");
    setSuccessMessage("");
    resendMutation.mutate({ email });
  };

  const isPending = verifyMutation.isPending || resendMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl border border-[#EBE6DA] dark:border-gray-800 p-8 shadow-sm">
        <div className="flex justify-center mb-3">
          <Logo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Verify your email</h1>

        {email ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
            We sent a 6-digit code to <span className="font-medium text-gray-800 dark:text-gray-200">{email}</span>
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
            Please enter your registered email and the 6-digit verification code.
          </p>
        )}

        {emailSent === false && devOtp && (
          <div className="bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-transparent dark:border-yellow-800/50 text-sm rounded-lg px-3 py-2 mb-4">
            <strong>Dev Mode:</strong> Email delivery failed. Use this code:{" "}
            <span className="font-mono text-lg font-bold">{devOtp}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-transparent dark:border-red-800/50 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-transparent dark:border-green-800/50 text-sm rounded-lg px-3 py-2 mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialEmail && (
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">6-digit code</label>
            <input
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || otp.length !== 6 || !email}
            className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isPending || !email}
          className="w-full text-center text-sm font-medium mt-4 transition text-accent hover:underline disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
        >
          {resendMutation.isPending
            ? "Sending..."
            : cooldown > 0
            ? `Resend OTP in ${cooldown}s`
            : "Resend OTP"}
        </button>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}