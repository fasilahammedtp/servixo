import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../services/api";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const mutation = useMutation({
        mutationFn: (data: { token: string; newPassword: string }) =>
            api.post("/auth/reset-password", data),
        onSuccess: () => {
            navigate("/login");
        },
        onError: (error: any) => {
            setErrorMessage(error?.response?.data?.message || "Couldn't reset your password. The link may have expired.");
        },
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords don't match");
            return;
        }

        if (!token) {
            setErrorMessage("This reset link is missing its token. Please request a new one.");
            return;
        }

        mutation.mutate({ token, newPassword });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1513] px-4 transition-colors duration-300">
            <div className="w-full max-w-sm bg-white dark:bg-[#132320] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EBE6DA] dark:border-gray-800 p-8">
                <h1 className="text-2xl font-semibold text-navy dark:text-white text-center mb-1">Set a new password</h1>
                <p className="text-gray-500 text-center text-sm mb-6">
                    Choose a new password for your account
                </p>

                {errorMessage && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
                        {errorMessage}
                    </div>
                )}

                {!token && (
                    <div className="bg-amber-50 text-amber-700 text-sm rounded-lg px-3 py-2 mb-4">
                        No reset token found in this link. Please use the link from your email, or{" "}
                        <Link to="/forgot-password" className="underline font-medium">
                            request a new one
                        </Link>
                        .
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">New password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                            placeholder="At least 6 characters"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Confirm new password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                            placeholder="Re-enter your new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending || !token}
                        className="w-full bg-navy text-white rounded-lg py-2.5 font-medium hover:bg-navy/90 transition disabled:opacity-60"
                    >
                        {mutation.isPending ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    <Link to="/login" className="text-accent font-medium hover:underline">
                        Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
}