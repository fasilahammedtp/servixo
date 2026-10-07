import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { verifyOtp, resendOtp } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const state = location.state as { email?: string; devOtp?: string; emailSent?: boolean } | null;
  const email = state?.email || user?.email || sessionStorage.getItem("pendingEmail") || "";

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [devOtp, setDevOtp] = useState<string | undefined>(state?.devOtp);
  const [emailSent, setEmailSent] = useState<boolean | undefined>(state?.emailSent);

  useEffect(() => {
    if (!email) {
      setErrorMessage("No email provided.");
    }
  }, [email]);

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      sessionStorage.removeItem("pendingEmail");
      navigate(user?.role === "worker" ? "/worker/profile-setup" : "/home");
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

  const isPending = verifyMutation.isPending || resendMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-8">
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Verify your email</h1>

        <p className="text-gray-500 text-center text-sm mb-6">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>

        {emailSent === false && devOtp && (
          <div className="bg-yellow-50 text-yellow-800 text-sm rounded-lg px-3 py-2 mb-4">
            <strong>Dev Mode:</strong> Email delivery failed. Use this code:{" "}
            <span className="font-mono text-lg font-bold">{devOtp}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={isPending || otp.length !== 6}
            className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <button
          onClick={() => resendMutation.mutate({ email })}
          disabled={isPending}
          className="w-full text-center text-sm text-accent font-medium hover:underline mt-4 disabled:opacity-60"
        >
          {resendMutation.isPending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}