import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (email: string) => api.post("/auth/forgot-password", { email }),
    onSuccess: () => setSubmitted(true),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-8">
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Reset your password</h1>

        <p className="text-gray-500 text-center text-sm mb-6">
          Enter your email and we'll send you a reset link
        </p>

        {submitted ? (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-3 text-center">
            If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60"
            >
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-accent font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
