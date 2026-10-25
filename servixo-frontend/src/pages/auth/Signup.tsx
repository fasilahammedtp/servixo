import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { registerUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";
import { UserRole } from "../../types";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const presetRole = (location.state as { presetRole?: UserRole })?.presetRole;
  const [role, setRole] = useState<UserRole>(presetRole || "customer");

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data: any) => {
      login(data.user, data.token);
      sessionStorage.setItem("pendingEmail", data.user.email);
      navigate("/verify-otp", {
        state: {
          email: data.user.email,
          devOtp: data.devOnly_otp,
          emailSent: data.emailSent
        }
      });
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || "Registration failed. Please try again.");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {

      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = "+91" + formattedPhone;
      } else if (!formattedPhone.startsWith("+")) {
         setErrorMessage("Phone number must include country code (e.g., +1 or +91)");
         return;
      }
    }

    mutation.mutate({ name, email, phone: formattedPhone, password, role });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 py-8 sm:py-10 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-5 sm:p-8">
        <div className="flex justify-center mb-3">
          <Logo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Create your account</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Join Servixo in seconds</p>


        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 text-sm font-medium py-2.5 rounded-md transition min-h-[40px] flex items-center justify-center ${role === "customer" ? "bg-white dark:bg-[#142623] text-navy dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("worker")}
            className={`flex-1 text-sm font-medium py-2.5 rounded-md transition min-h-[40px] flex items-center justify-center ${role === "worker" ? "bg-white dark:bg-[#142623] text-navy dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
          >
            Worker
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-transparent dark:border-red-800/50 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="Your name"
            />
          </div>
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
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Phone</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="+919876543210"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm sm:text-base min-h-[42px]"
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-navy text-white rounded-lg py-2.5 sm:py-3 font-semibold hover:bg-navy/90 transition disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline inline-block py-1">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
