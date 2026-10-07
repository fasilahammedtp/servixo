import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { LogoIcon } from "../../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.user, data.token);

      const destination =
        data.user.role === "admin" ? "/admin" : data.user.role === "worker" ? "/worker" : "/home";
      navigate(destination);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || "Login failed. Please try again.");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    mutation.mutate({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-8">
        <div className="flex justify-center mb-3">
          <LogoIcon className="w-12 h-12 rounded-xl shadow-md" />
        </div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Log in to your Servixo account</p>


        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </div>
        )}

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
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent font-medium"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60"
          >
            {mutation.isPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here?{" "}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
